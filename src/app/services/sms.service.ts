import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { tap } from 'rxjs';
const base_url = environment.base_url;

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
   *   GET TOKEN
  ==================================================================== */
  get token():string {
    return localStorage.getItem('token') || '';
  }

  /** ================================================================
   *   GET HEADERS
  ==================================================================== */
  get headers() {
    return {
      headers: {
        'x-token': this.token
      }
    }
  }

  /** ================================================================
   *  GENERATE MODULES
  ==================================================================== */
  public modulos: any[] = [];
  loadModules(){
    return this.http.get<{ok: boolean, modulos: any[]}>( `${this.url}/ports`)
      .pipe(
        tap( ({modulos}) => {
          this.modulos = modulos;          
        })
      );
  }

  /** ================================================================
   *  SELECT MODULO
  ==================================================================== */
  selectModulo(modulo: any){
    return this.http.post<{ok: boolean, using: string}>( `${this.url}/select-port`, modulo);
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
    return this.http.post( `${this.url}/call`, {number});
  }

  /** ================================================================
   *  LOAD SMS CLOUD
  ==================================================================== */
  loadSmsCloud(query: any){
    return this.http.post<{ok: boolean, sms: any[], total: number}>( `${base_url}/sms/query`, query, this.headers );
  }

}
