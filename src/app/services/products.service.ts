import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from '../models/products.model';


import { environment } from '../../environments/environment';
const base_url = environment.base_url;

@Injectable({
  providedIn: 'root'
})
export class ProductsService {

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
   *  LOAD QUERY
  ==================================================================== */
  loadProducts(query: any){
    return this.http.post<{ok: boolean, products: Product[], total: number}>( `${base_url}/products/query`, query, this.headers );
  }

  /** ================================================================
   *  LOAD ID
  ==================================================================== */
  loadProductsID(id: string){
    return this.http.get<{ok: boolean, product: Product}>( `${base_url}/products/${id}`, this.headers );
  }

  /** ================================================================
   *  CREATE
  ==================================================================== */
  createProducts(formData: any){
    return this.http.post<{ok: Boolean, product: Product}>(`${base_url}/products`, formData, this.headers);
  }

  /** ================================================================
   *  UPDATE
  ==================================================================== */
  updateProduct(formData: any, id: string){
    return this.http.put<({ok: Boolean, product: Product})>(`${base_url}/products/${id}`, formData, this.headers);
  }

}
