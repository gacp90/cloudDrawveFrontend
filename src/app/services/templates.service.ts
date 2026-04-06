import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { Template } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplatesService {

  private url = environment.wp_url;

  constructor(  private http: HttpClient) { }

  createTemplate(apiKey: string, templateData: any): Observable<any> {
    return this.http.post(`${this.url}/templates/`, templateData, {
      headers: {
        'x-api-key': apiKey
      }
    });
  }

  loadTemplates(apiKey: string, query: any): Observable<{ok: boolean, templates: Template[], total: number}> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.post<{ok: boolean, templates: Template[], total: number}>(`${this.url}/templates/query`, query, { headers }); }

  searchTemplates(apiKey: string, query: any): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.post(`${this.url}/templates/search`, query, { headers });
  }

  // Llamar al endpoint de sincronización manual (POST /templates/sync)
  syncTemplates(apiKey: string): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.post(`${this.url}/templates/sync`, {}, { headers });
  }

  toggleTemplateActive(apiKey: string, templateId: string, active: boolean): Observable<any> {
    const headers = new HttpHeaders({ 'x-api-key': apiKey });
    return this.http.patch(`${this.url}/templates/${templateId}/toggle-active`, { active }, { headers });
  }

}
