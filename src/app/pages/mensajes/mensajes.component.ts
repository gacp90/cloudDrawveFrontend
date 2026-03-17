import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { ChatService } from 'src/app/services/chat.service';
import { UsersService } from 'src/app/services/users.service';

import { io } from 'socket.io-client';


@Component({
  selector: 'app-mensajes',
  templateUrl: './mensajes.component.html',
  styleUrls: ['./mensajes.component.css']
})
export class MensajesComponent implements OnInit {
  
  public user!: User;
  public internalApiKey: string = 'token_secreto_rifari_123'; // Esta clave debe ser la misma que configures en tu backend
  private socket: any;
  constructor(  private chatService: ChatService,
                private usersService: UsersService

  ){
    this.user = usersService.user;
  }


  ngOnInit(): void {

    this.loadChatList();
    this.setupSocketConnection();

  }

  /** ======================================================================
   * CHATS
  ====================================================================== */
  chats: any[] = []; // Lista lateral
  selectedChat: any = null;
  messages: any[] = []; // Burbujas del chat actual
  newMessageText: string = '';
  showMobilePanel: boolean = false;

  private handleIncomingMessage(payload: any) {
    const { message, customer } = payload;

    // 1. Si el mensaje es del chat que tenemos abierto, lo añadimos
    if (this.selectedChat && this.selectedChat._id === customer) {
      this.messages.push(message);
      this.scrollToBottom();
    }

    // 2. Actualizamos la lista lateral (orden y último mensaje)
    const index = this.chats.findIndex(c => c._id === customer);
    if (index !== -1) {
      this.chats[index].lastMessage = message;
      // Lo movemos al principio
      const chatToMove = this.chats.splice(index, 1)[0];
      this.chats.unshift(chatToMove);
    } else {
      // Si es un chat nuevo que no estaba en la lista, lo añadimos de primero
      this.chats.unshift({
        _id: customer,
        lastMessage: message,
        unreadCount: 1
      });
    }
  }

  // Función para cargar la lista lateral (Aggregate)
  loadChatList() {
    this.chatService.getChatList(this.internalApiKey).subscribe({
      next: (data) => {
        this.chats = data;        
      },
      error: (err) => console.error('Error:', err)
    });
  }

  // Función que se ejecuta al hacer click en un chat de la lista
  selectChat(chat: any) {
    this.selectedChat = chat;
    this.showMobilePanel = false;

    // El _id en el aggregate que hicimos es el número de teléfono del cliente
    const customerPhone = chat._id;

    this.chatService.getChatHistory(this.internalApiKey, customerPhone).subscribe({
      next: (msgs) => {
        // .reverse() es necesario porque el backend los trae [nuevo...viejo]
        // y el chat se lee de [viejo...nuevo]
        console.log(msgs);
        
        this.messages = msgs.reverse();
        this.scrollToBottom();
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  sendMessage() {
    if (!this.newMessageText.trim() || !this.selectedChat) return;

    const to = this.selectedChat._id;
    const message = this.newMessageText;

    // Limpiamos el input para UX
    this.newMessageText = '';

    // Usamos el servicio de whatsapp (o chatService si apunta al endpoint de whatsapp)
    this.chatService.sendToWhatsApp(this.internalApiKey, to, message).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Añadimos el mensaje guardado que nos devolvió el servidor
          this.messages.push(res.data);
          this.scrollToBottom();

          // Actualizamos la vista previa en la lista lateral
          const chatIdx = this.chats.findIndex(c => c._id === to);
          if (chatIdx !== -1) {
            this.chats[chatIdx].lastMessage = res.data;
          }
        }
      },
      error: (err) => {
        console.error('Error enviando:', err);
        alert('Error al enviar el mensaje');
      }
    });
  }


  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }, 100);
    } catch (err) {}
  }

  imageSelected: string | null = null; // Almacena el nombre del archivo

  openImage(fileName: string) {
    this.imageSelected = fileName;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file || !this.selectedChat) return;

    // Validar tamaño (ejemplo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es muy pesado (máx 5MB)');
      return;
    }

    this.uploadAndSendFile(file);
  }

  uploadAndSendFile(file: File) {
    const to = this.selectedChat._id;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('to', to);
    
    this.chatService.sendFileToWhatsApp(this.internalApiKey, formData).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.messages.push(res.data);
          this.scrollToBottom();
        }
      },
      error: (err) => console.error('Error subiendo archivo', err)
    });
  }

  playNotificationSound() {
    try {
      const audio = new Audio();
      audio.src = '../../assets/sounds/notificacion.mp3';
      audio.load();
      audio.play();
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de notificación', error);
    }
  }

  setupSocketConnection() {
    if (!this.internalApiKey) {
      console.warn('Esperando internalApiKey para conectar socket...');
      return; 
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io('http://localhost:3000', {
      auth: {
        'x-api-key': this.internalApiKey 
      },
      query: {
        'x-api-key': this.internalApiKey 
      },
      transports: ['websocket'],
      reconnection: true
    });

    // CONEXION
    this.socket.on('connect', () => {      
      this.socket.emit('join_channel', this.internalApiKey);
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Error de conexión:', error.message);
    });

    this.socket.on('new_message', (payload: any) => {
      const { message, customer } = payload;
      if (message.direction === 'inbound') this.playNotificationSound();
      if (this.selectedChat && this.selectedChat._id === customer) {
        this.messages.push(message);
        this.scrollToBottom();
      }
      this.updateChatListFromSocket(customer, message);
    });
}

  private updateChatListFromSocket(customer: string, message: any) {
    const index = this.chats.findIndex(c => c._id === customer);
    
    if (index !== -1) {
      // Si ya existe en la lista, actualizamos su último mensaje
      this.chats[index].lastMessage = message;
      
      // Si no es el chat abierto, podríamos marcarlo como "no leído" (opcional)
      if (!this.selectedChat || this.selectedChat._id !== customer) {
        this.chats[index].unreadCount = (this.chats[index].unreadCount || 0) + 1;
      }

      // Lo movemos a la parte superior de la lista
      const chatToMove = this.chats.splice(index, 1)[0];
      this.chats.unshift(chatToMove);
    } else {
      // Si es un contacto nuevo que no estaba en la lista, lo creamos de primero
      this.chats.unshift({
        _id: customer,
        lastMessage: message,
        unreadCount: 1
      });
    }
  }

  // 5. Muy importante: cerrar el socket cuando salgas del componente
  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }


}
