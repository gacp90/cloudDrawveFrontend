import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Rifa } from '../models/rifas.model';

import { environment } from '../../environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class RifasService {

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
   *  LOAD RIFAS
  ==================================================================== */
  loadRifas(query: any){
    return this.http.post<{ok: boolean, rifas: Rifa[], total: number}>( `${base_url}/rifas/query`, query, this.headers );
  }

  /** ================================================================
   *  LOAD RIFA ID
  ==================================================================== */
  loadRifaID(id: string){
    return this.http.get<{ok: boolean, rifa: Rifa}>( `${base_url}/rifas/${id}`, this.headers );
  }

  /** ================================================================
   *  CREATE RIFA
  ==================================================================== */
  createRifa(formData: any){
    return this.http.post<{ok: Boolean, rifa: Rifa}>(`${base_url}/rifas`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE RIFA
  ==================================================================== */
  updateRifa(formData: any, id: string){
    return this.http.put<({ok: Boolean, rifa: Rifa})>(`${base_url}/rifas/${id}`, formData, this.headers);
  }
}
