import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { User } from 'src/app/models/users.model';
import { ChatService } from 'src/app/services/chat.service';
import { UsersService } from 'src/app/services/users.service';

import { io } from 'socket.io-client';
import { ClientesService } from 'src/app/services/clientes.service';


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
                private usersService: UsersService,
                private clientesService: ClientesService

  ){
    this.user = usersService.user;
    this.internalApiKey = this.user.internalApiKey!;
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
    const customerPhone = chat.customerPhone;    

    this.chatService.getChatHistory(this.internalApiKey, chat.customerPhone).subscribe({
      next: (msgs) => {

        // .reverse() es necesario porque el backend los trae [nuevo...viejo]
        // y el chat se lee de [viejo...nuevo]        
        this.messages = msgs.reverse();

        // Si tiene mensajes sin leer, disparamos la lectura
        if (this.selectedChat.unreadCount > 0) {
          
          // 1. Actualización visual instantánea (UX)
          this.selectedChat.unreadCount = 0; 

          // 2. Avisamos a NestJS para que le envíe el doble check azul a Meta
          // Asumiendo que pasas el ID del mensaje o del teléfono
          this.chatService.marcarComoLeido(this.internalApiKey, {wamid: this.selectedChat.lastMessage.wamid}).subscribe({
            next: () => console.log('Doble check azul enviado'),
            error: (err) => console.error('Error al marcar como leído', err)
          });
        }

        if (!this.selectedChat.customerName) {
          this.selectedChat.buscandoNombre = true;

          this.clientesService.loadClienteForPhone(customerPhone).subscribe({
            next: (res: any) => {
              if (res.ok && res.nombre) { 
                const newName = res.nombre.trim();
                // ¡AQUÍ REUTILIZAMOS LA FUNCIÓN!
                this.updateCustomerNameInBackend(customerPhone, newName, this.selectedChat);
              }
            },
            error: (err) => {
              this.selectedChat.isUnknown = true;
              this.selectedChat.buscandoNombre = false;
            },
            complete: () => {
              this.selectedChat.buscandoNombre = false;
            }
          });
        }

        this.scrollToBottom();
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  sendMessage() {

    if (!this.newMessageText.trim() || !this.selectedChat) return;

    const to = this.selectedChat.customerPhone;
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
          const chatIdx = this.chats.findIndex(c => c.customerPhone === to);
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
    const to = this.selectedChat.customerPhone;
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

    this.socket = io('https://wpdemo.rifari.com', {
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
      if (this.selectedChat && this.selectedChat.customerPhone === customer) {
        this.messages.push(message);
        this.scrollToBottom();
      }
      this.updateChatListFromSocket(customer, message);
    });
}

  private updateChatListFromSocket(customer: string, message: any) {
    const index = this.chats.findIndex(c => c.customerPhone === customer);
    
    if (index !== -1) {
      // Si ya existe en la lista, actualizamos su último mensaje
      this.chats[index].lastMessage = message;
      
      // Si no es el chat abierto, podríamos marcarlo como "no leído" (opcional)
      if (!this.selectedChat || this.selectedChat.customerPhone !== customer) {
        this.chats[index].unreadCount = (this.chats[index].unreadCount || 0) + 1;
      }

      // Lo movemos a la parte superior de la lista
      const chatToMove = this.chats.splice(index, 1)[0];
      this.chats.unshift(chatToMove);
    } else {
      // Si es un contacto nuevo que no estaba en la lista, lo creamos de primero
      this.chats.unshift({
        _id: customer,
        customerPhone: customer,
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

  // ======================================================================
  // NOTAS DE VOZ (MediaRecorder API)
  // ======================================================================
  isRecording: boolean = false;
  mediaRecorder: any;
  audioChunks: any[] = [];
  mediaStream: MediaStream | null = null;

  async startRecording() {
    if (!this.selectedChat) return;
    
    try {
      // Pedimos permiso para usar el micrófono
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.mediaStream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        // Empaquetamos el audio en un Blob genérico
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Lo convertimos en un File para poder reusar tu función uploadAndSendFile
        // Nota: Le ponemos extensión .webm temporalmente, el backend (NestJS) lo pasará a .ogg
        const audioFile = new File([audioBlob], `voice_note_${new Date().getTime()}.webm`, { type: 'audio/webm' });
        
        this.uploadAndSendFile(audioFile);

        // Apagamos el micrófono para que no quede el punto rojo en el navegador
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('Debes permitir el acceso al micrófono para enviar notas de voz.');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  // ======================================================================
  // BUSCAR CLIENTE POR TELEFONO
  // ======================================================================
  private updateCustomerNameInBackend(phone: string, name: string, chatRef: any) {
    chatRef.customerName = name;
    chatRef.isUnknown = false;

    // 2. Enviamos la petición en segundo plano a NestJS
    this.chatService.updateCustomerName(this.internalApiKey, { 
      customerPhone: phone, 
      newName: name 
    }).subscribe({
      next: (resp) => console.log('✅ Nombre guardado en NestJS', resp),
      error: (err) => {
        console.error('❌ Error guardando en NestJS', err);
        // Opcional: Revertir el nombre si falla, o mostrar un Toast de error
      }
    });
  }

  chatParaEditar: any = null;
  nuevoNombreManual: string = '';
  // ==========================================
  // LÓGICA DEL MODAL MANUAL
  // ==========================================
  abrirModalNuevoCliente(chat: any) {
    this.chatParaEditar = chat;
    this.nuevoNombreManual = ''; // Limpiamos el input
  }

  guardarNombreManual() {
    if (!this.nuevoNombreManual.trim() || !this.chatParaEditar) return;

    const phone = this.chatParaEditar.customerPhone || this.chatParaEditar._id;
    const name = this.nuevoNombreManual.trim();

    // ¡AQUÍ VOLVEMOS A REUTILIZAR LA FUNCIÓN!
    this.updateCustomerNameInBackend(phone, name, this.chatParaEditar);

    // TODO Opcional: Si quieres que este nuevo cliente quede registrado 
    // en tu base de datos principal (Express), aquí deberías llamar a 
    // this.clientesService.crearCliente(...)

    this.cerrarModal();
  }

  cerrarModal() {
    this.chatParaEditar = null;
    this.nuevoNombreManual = '';
    // Aquí puedes colocar la lógica para cerrar el modal de Bootstrap
    // Dependiendo de cómo lo uses: Ej. jQuery $('#modalAgregar').modal('hide')
  }


}
