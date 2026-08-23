import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { Company, CompanyPayload } from '../models/company.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class CompaniesService {
  private readonly base = `${environment.apiUrl}/backoffice/companies`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<Company>> {
    return this.http.get<PaginatedResponse<Company>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<Company> {
    return this.http.get<Company>(`${this.base}/${id}`);
  }

  create(payload: CompanyPayload): Observable<Company> {
    return this.http.post<Company>(this.base, payload);
  }

  update(id: string, payload: CompanyPayload): Observable<Company> {
    return this.http.patch<Company>(`${this.base}/${id}`, payload);
  }

  enable(id: string): Observable<Company> {
    return this.http.patch<Company>(`${this.base}/${id}/enable`, {});
  }

  disable(id: string): Observable<Company> {
    return this.http.patch<Company>(`${this.base}/${id}/disable`, {});
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
