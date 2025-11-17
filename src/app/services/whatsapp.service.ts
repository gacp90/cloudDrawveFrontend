import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface _message{
  number: string,
  message: string
}

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {

  constructor(  private http: HttpClient) { }
  
  /** ================================================================
   *  GENERATE QR
  ==================================================================== */
  generateQR(id: string, wp: string){
    return this.http.get<{ok: boolean, qr: string}>( `${wp}/api/whatsapp/qr/${id}`);
  }

  /** ================================================================
   *  SEND MESSAGE
  ==================================================================== */
  sendMessage(id: string, message: _message, wp: string){
    return this.http.post<{ok: boolean, msg: string}>( `${wp}/api/whatsapp/send/${id}`, message);
  }

  /** ================================================================
   *  SEND IMAGE
  ==================================================================== */
  sendImage(id: string, number: string, img: any, caption: string = '', wp: string){

    const formData = new FormData();
    formData.append('image', img);
    formData.append('caption', caption);

    return this.http.post<{ok: boolean, msg: string}>( `${wp}/api/whatsapp/send-iamge/${id}/${number}`, formData);
  }

  /** ================================================================
   *  SEND MESSAGE MASIVE
  ==================================================================== */
  sendMessageMasive(id: string, message: any, wp: string){
    return this.http.post<{ok: boolean, msg: string}>( `${wp}/api/whatsapp/masive/${id}`, message);
  }

  /** ================================================================
   *  SEND MESSAGE MASIVE WITH IMG
  ==================================================================== */
  sendMessageMasiveImg(id: string, message: any, wp: string, img: any){
    
    const formData = new FormData();
  
    // Agregamos la imagen al FormData
    formData.append('image', img);

    // Convertimos el mensaje en un string JSON y lo agregamos
    formData.append('message', JSON.stringify(message));    

    return this.http.post<{ok: boolean, msg: string}>( `${wp}/api/whatsapp/masive/img/${id}`, formData);
  }

  /** ================================================================
   *  LOGOUT
  ==================================================================== */
  logoutWhatsapp(wp: string){
    return this.http.get<{ok: boolean, msg: string}>( `${wp}/api/whatsapp/logout`);
  }

}
