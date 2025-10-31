import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { Client } from '../models/clientes.model';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

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
     *  LOAD CLIENTES
    ==================================================================== */
    loadClientes(query: any){
      return this.http.post<{ok: boolean, clientes: Client[], total: number}>( `${base_url}/clients/query`, query, this.headers );
    }
  
    /** ================================================================
     *  LOAD CLIENTE ID
    ==================================================================== */
    loadClienteID(id: string){
      return this.http.get<{ok: boolean, cliente: Client}>( `${base_url}/clients/${id}`, this.headers );
    }
  
    /** ================================================================
     *  CREATE CLIENTE
    ==================================================================== */
    createCliente(formData: any){
      return this.http.post<{ok: Boolean, cliente: Client}>(`${base_url}/clients`, formData, this.headers);
    }
  
    /** ================================================================
     *  UPDATE CLIENTE
    ==================================================================== */
    updateCliente(formData: any, id: string){
      return this.http.put<({ok: Boolean, cliente: Client})>(`${base_url}/clients/${id}`, formData, this.headers);
    }
}
