import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpidiService {

  private apiUrl = `${environment.wp_url}/spidi`;

  constructor(private http: HttpClient) {}

  // Generar el link de pago
  crearCheckout(creditos: number, usuario: string, key: string): Observable<any> {    
    const headers = new HttpHeaders({
      'x-api-key': key || ''
    });

    const body = {
      creditos: creditos,
      link: window.location.origin+'/dashboard',
      usuario: usuario
    };    

    return this.http.post(`${this.apiUrl}/checkout`, body, { headers });
  }

  // Obtener el historial
  obtenerHistorial(key: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': key || '' });
    return this.http.get(`${this.apiUrl}/history`, { headers });
  }

}
