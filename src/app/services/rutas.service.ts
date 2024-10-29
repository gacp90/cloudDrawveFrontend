import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Ruta } from '../models/rutas.model';

import { environment } from '../../environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class RutasService {

  constructor(  private http: HttpClient) { }

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
   *  LOAD RUTAS
  ==================================================================== */
  loadRutas(query: any){
    return this.http.post<{ok: boolean, rutas: Ruta[], total: number}>( `${base_url}/rutas/query`, query, this.headers );
  }

  /** ================================================================
   *  LOAD RUTA ID
  ==================================================================== */
  loadRutaID(id: string){
    return this.http.get<{ok: boolean, ruta: Ruta}>( `${base_url}/rutas/${id}`, this.headers );
  }

  /** ================================================================
   *  CREATE RUTA
  ==================================================================== */
  createRuta(formData: any){
    return this.http.post<{ok: Boolean, ruta: Ruta}>(`${base_url}/rutas`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE RUTA
  ==================================================================== */
  updateRuta(formData: any, id: string){
    return this.http.put<({ok: Boolean, ruta: Ruta})>(`${base_url}/rutas/${id}`, formData, this.headers);
  }
}
