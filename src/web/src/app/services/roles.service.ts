import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { Role, RolePayload } from '../models/role.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly base = `${environment.apiUrl}/backoffice/roles`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<Role>> {
    return this.http.get<PaginatedResponse<Role>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.base}/${id}`);
  }

  create(payload: RolePayload): Observable<Role> {
    return this.http.post<Role>(this.base, payload);
  }

  update(id: string, payload: RolePayload): Observable<Role> {
    return this.http.patch<Role>(`${this.base}/${id}`, payload);
  }

  enable(id: string): Observable<Role> {
    return this.http.patch<Role>(`${this.base}/${id}/enable`, {});
  }

  disable(id: string): Observable<Role> {
    return this.http.patch<Role>(`${this.base}/${id}/disable`, {});
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
