import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { Invoice, InvoicePayload } from '../models/invoice.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  private readonly base = `${environment.apiUrl}/backoffice/invoices`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<Invoice>> {
    return this.http.get<PaginatedResponse<Invoice>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/${id}`);
  }

  create(payload: InvoicePayload): Observable<Invoice> {
    return this.http.post<Invoice>(this.base, payload);
  }

  update(id: string, payload: InvoicePayload): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.base}/${id}`, payload);
  }

  cancel(id: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.base}/${id}/cancel`, {});
  }
}
