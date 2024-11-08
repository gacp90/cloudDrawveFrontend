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

  public url = 'https://www.whatsapp.drawve.com/api/whatsapp'

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

}
