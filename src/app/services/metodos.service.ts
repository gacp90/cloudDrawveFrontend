import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Metodo } from '../models/metodos.model';

import { environment } from '../../environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class MetodosService {

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
     *  LOAD
    ==================================================================== */
    loadMetodos(query: any){
      return this.http.post<{ok: boolean, metodos: Metodo[], total: number}>( `${base_url}/metodos/query`, query, this.headers );
    }
  
    /** ================================================================
     *  LOAD ID
    ==================================================================== */
    loadMetodoID(id: string){
      return this.http.get<{ok: boolean, metodo: Metodo}>( `${base_url}/metodos/${id}`, this.headers );
    }
  
    /** ================================================================
     *  CREATE 
    ==================================================================== */
    createMetodo(formData: any){
      return this.http.post<{ok: Boolean, metodo: Metodo}>(`${base_url}/metodos`, formData, this.headers);
    }
  
    /** ================================================================
     *  UPDATE 
    ==================================================================== */
    updateMetodo(formData: any, id: string){
      return this.http.put<({ok: Boolean, metodo: Metodo})>(`${base_url}/metodos/${id}`, formData, this.headers);
    }
}
