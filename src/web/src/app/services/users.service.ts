import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { User, UserCreatePayload, UserUpdatePayload } from '../models/user.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly base = `${environment.apiUrl}/backoffice/users`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(payload: UserCreatePayload): Observable<User> {
    return this.http.post<User>(this.base, payload);
  }

  update(id: string, payload: UserUpdatePayload): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, payload);
  }

  enable(id: string): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/enable`, {});
  }

  disable(id: string): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}/disable`, {});
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }

  resetPassword(id: string, password: string): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/reset-password`, { password });
  }
}
