import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface _message{
  number: string,
  message: string
}

@Injectable({
  providedIn: 'root'
})
export class SmsService {

  constructor(  private http: HttpClient) { }

  public url: string = 'http://localhost:3001/api/v1/module1';

  /** ================================================================
   *  GENERATE MODULES
  ==================================================================== */
  loadModules(){
    return this.http.get<{ok: boolean, modulos: any[]}>( `${this.url}/ports`);
  }

  /** ================================================================
   *  SELECT MODULO
  ==================================================================== */
  selectModulo(message: _message, wp: string){
    return this.http.post<{ok: boolean, using: string}>( `${this.url}/select-port`, message);
  }

  /** ================================================================
   *  SEND MESSAGE
  ==================================================================== */
  sendMessageSMS(message: _message){
    return this.http.post<{ok: boolean, msg: string}>( `${this.url}/`, message);
  }

  /** ================================================================
   *  SEND MESSAGE MASIVE
  ==================================================================== */
  sendMessageMasiveSMS(message: any){
    return this.http.post<{ok: boolean, total: number, msg: string}>( `${this.url}/masive`, message);
  }

  /** ================================================================
   *  CALL CLIENT
  ==================================================================== */
  callClient(number: string){
    return this.http.post( `${this.url}/makeCall`, {number});
  }

}
