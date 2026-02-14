import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Venta } from '../models/ventas.model';

import { environment } from '../../environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class VentasService {

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
   *  LOAD VENTAS
  ==================================================================== */
  loadVentasQuery(query: any){
    return this.http.post<{ok: boolean, ventas: Venta[], total: number}>( `${base_url}/sales/query`, query, this.headers );
  }

}
