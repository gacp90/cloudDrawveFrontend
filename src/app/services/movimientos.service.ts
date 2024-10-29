import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { Movimiento } from '../models/movimientos.model';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {

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
   *  LOAD MOVIMIENTOS
  ==================================================================== */
  loadMovimientos(query: any){
    return this.http.post<{ok: boolean, movimientos: Movimiento[], total: number, totalMovimiento: number}>( `${base_url}/movimientos/query`, query, this.headers );
  }

  /** ================================================================
   *  CREATE MOVIMIENTO
  ==================================================================== */
  createMovimiento(formData: any){
    return this.http.post<{ok: Boolean, movimiento: Movimiento}>(`${base_url}/movimientos`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE MOVIMIENTO
  ==================================================================== */
  updateMovimiento(formData: any, id: string){
    return this.http.put<({ok: Boolean, movimiento: Movimiento})>(`${base_url}/movimientos/${id}`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE MOVIMIENTO
  ==================================================================== */
  deleteMovimiento(moid: string){
    return this.http.delete<({ok: Boolean, msg: string})>(`${base_url}/movimientos/${moid}`, this.headers);
  }
}
