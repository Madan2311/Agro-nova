import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedProducts, Product, ProductFilters, ProductPayload } from './product.models';

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/products`;

  list(page: number, limit: number, filters: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams().set('page', page).set('limit', limit).set('sort', filters.sort);

    const search = filters.search.trim();
    if (search) params = params.set('search', search);
    if (filters.category) params = params.set('category', filters.category);
    if (filters.active) params = params.set('active', filters.active);
    if (filters.stock) params = params.set('stock', filters.stock);

    return this.http.get<PaginatedProducts>(this.url, { params });
  }

  get(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${id}`);
  }

  create(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.url, payload);
  }

  update(id: string, payload: Partial<ProductPayload>): Observable<Product> {
    return this.http.patch<Product>(`${this.url}/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.url}/${id}`);
  }
}