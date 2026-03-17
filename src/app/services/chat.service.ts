import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private url = environment.wp_url; // Ej: http://localhost:3000 o tu URL de Cloudflare
  
  // Usaremos un Subject para avisar a los componentes cuando llegue un mensaje
  private newMessageSubject = new Subject<any>();

  constructor(private http: HttpClient) {
    this.socket = io(this.url);

    // Escuchar el evento que configuramos en el Backend
    this.socket.on('new_message', (data) => {
      this.newMessageSubject.next(data);
    });
  }

  

  // Unirse a la sala privada del canal (organizador)
  joinChannel(channelId: string) {
    this.socket.emit('join_channel', channelId);
  }

  getChatList(internalApiKey: string): Observable<any[]> {
    const headers = new HttpHeaders({
      'x-api-key': internalApiKey
    });
    // Ya no pasamos el ID en la URL
    return this.http.get<any[]>(`${this.url}/chat/list`, { headers });
  }

  getChatHistory(internalApiKey: string, phone: string): Observable<any[]> {
    const headers = new HttpHeaders({
      'x-api-key': internalApiKey
    });
    // Pasamos el teléfono por Query Params y la Key por Header
    return this.http.get<any[]>(`${this.url}/chat/history?phone=${phone}`, { headers });
  }

  // Observable para que el componente se suscriba a mensajes nuevos
  onNewMessage() {
    return this.newMessageSubject.asObservable();
  }

  // En chat.service.ts
  getMediaUrl(fileName: string): string {
    return `${this.url}/media/whatsapp/${fileName}`;
  }

  sendToWhatsApp(apiKey: string, to: string, message: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.post(`${this.url}/whatsapp/send`, { to, message }, { headers });
  }

  sendFileToWhatsApp(apiKey: string, formData: FormData): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.post(`${this.url}/whatsapp/send-file`, formData, { headers }); 
  }

  getTemplates(apiKey: string): Observable<any[]> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    // Esta ruta debe coincidir con la que creamos en el controlador de NestJS
    return this.http.get<any[]>(`${this.url}/whatsapp/templates`, { headers });
  }

  sendTemplateMessage(apiKey: string, to: string, templateName: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    const body = { 
      to: to, 
      templateName: templateName // Asegúrate que tu backend espere este nombre de campo
    };
    
    // Ajusta la URL según tu ruta en el WhatsappController
    return this.http.post(`${this.url}/whatsapp/send-template`, body, { headers });
  }

  sendTemplateBulk(apiKey: string, payload: any): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.post(`${this.url}/whatsapp/send-template-bulk`, payload, { headers });
  }
}