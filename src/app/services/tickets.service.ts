import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Ticket } from '../models/ticket.model';

import { environment } from '../../environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class TicketsService {

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
   *  LOAD TICKETS
  ==================================================================== */
  loadTickets(query: any){
    return this.http.post<{ok: boolean, tickets: Ticket[], total: number, disponibles: number, apartados: number, pagados: number}>( `${base_url}/tickets/query`, query, this.headers );
  }

  /** ================================================================
   *  LOAD TICKET ID
  ==================================================================== */
  loadTicketID(id: string){
    return this.http.get<{ok: boolean, ticket: Ticket}>( `${base_url}/tickets/${id}`, this.headers );
  }

  /** ================================================================
   *  LOAD TICKET ID
  ==================================================================== */
  loadIngresosTickets(rifa: string){
    return this.http.get<{ok: boolean, apartados: Ticket[], pagados: Ticket[], totalApartado: number, totalPagado: number, pendientes: Ticket[], totalPendiente: number}>( `${base_url}/tickets/ingresos/${rifa}`, this.headers );
  }

  /** ================================================================
   *  LOAD TICKET ID
  ==================================================================== */
  searchTicket(busqueda: string, rifa: string){
    return this.http.get<{ok: boolean, tickets: Ticket[]}>( `${base_url}/tickets/search/${rifa}/${busqueda}`, this.headers );
  }

  /** ================================================================
   *  CREATE TICKET
  ==================================================================== */
  createTicket(formData: any){
    return this.http.post<{ok: Boolean, ticket: Ticket}>(`${base_url}/tickets`, formData, this.headers);
  }

  /** ================================================================
   *  CREATE TICKET
  ==================================================================== */
  ganadorTicket(formData: any){
    return this.http.post<{ok: Boolean, ticket: Ticket}>(`${base_url}/tickets/ganador`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE TICKET
  ==================================================================== */
  updateTicket(formData: any, id: string){
    return this.http.put<({ok: Boolean, ticket: Ticket})>(`${base_url}/tickets/${id}`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE TICKET
  ==================================================================== */
  updateVendedorTicket(formData: any, id: string){
    return this.http.put<({ok: Boolean, ticket: Ticket})>(`${base_url}/tickets/vendedor/${id}`, formData, this.headers);
  }

  /** ================================================================
   *  CLEAR TICKET
  ==================================================================== */
  clearTicket(id: string){
    return this.http.delete<({ok: Boolean, ticket: Ticket})>(`${base_url}/tickets/restore/${id}`, this.headers);
  }

}
