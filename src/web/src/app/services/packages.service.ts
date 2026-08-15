import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { Package, PackagePayload } from '../models/package.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class PackagesService {
  private readonly base = `${environment.apiUrl}/backoffice/packages`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<Package>> {
    return this.http.get<PaginatedResponse<Package>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<Package> {
    return this.http.get<Package>(`${this.base}/${id}`);
  }

  create(payload: PackagePayload): Observable<Package> {
    return this.http.post<Package>(this.base, this.normalize(payload));
  }

  update(id: string, payload: PackagePayload): Observable<Package> {
    return this.http.patch<Package>(`${this.base}/${id}`, this.normalize(payload));
  }

  disable(id: string): Observable<Package> {
    return this.http.patch<Package>(`${this.base}/${id}/disable`, {});
  }

  enable(id: string): Observable<Package> {
    return this.http.patch<Package>(`${this.base}/${id}/enable`, {});
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }

  private normalize(payload: PackagePayload): PackagePayload {
    const toLimit = (value: unknown) => {
      const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
      return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 1;
    };
    return {
      ...payload,
      price: Number(payload.price ?? 0),
      companyLimit: toLimit(payload.companyLimit),
      userLimit: toLimit(payload.userLimit),
    };
  }
}
