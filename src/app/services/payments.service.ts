import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';
import { Payment } from '../models/payments.model';
import { Ticket } from '../models/ticket.model';
const base_url = environment.base_url;


@Injectable({
  providedIn: 'root'
})
export class PaymentsService {

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
  loadPayments(query: any){
    return this.http.post<{ok: boolean, pagos: Payment[], total: number}>( `${base_url}/payments/query`, query, this.headers );
  }

  /** ================================================================
   *  LOAD
  ==================================================================== */
  loadPaymentsReport(query: any){
    return this.http.post<{ok: boolean, reporte: any, filtrosAplicados: any}>( `${base_url}/payments/query/report`, query, this.headers );
  }

  

  /** ================================================================
   *  CREATE 
  ==================================================================== */
  createPayment(formData: any){
    return this.http.post<{ok: boolean, msg: string, pagos: Payment[], resumenTickets: Ticket[]}>(`${base_url}/payments`, formData, this.headers);
  }

  /** ================================================================
   *  CONFIRM LOTE 
  ==================================================================== */
  updatePaymentLote(formData: any){
    return this.http.post<({ok: Boolean, pago: Payment})>(`${base_url}/payments/confirmar-lote`, { pagosIds: formData }, this.headers);
  }

  /** ================================================================
   *  CANCEL 
  ==================================================================== */
  cancelPayment(pagoId: string, data: { estadoCancelacion: string }){
    return this.http.put<({ok: Boolean, pago: Payment})>(`${base_url}/payments/${pagoId}`, data, this.headers);
  }
}
