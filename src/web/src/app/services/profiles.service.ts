import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { Profile, ProfilePayload } from '../models/profile.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private readonly base = `${environment.apiUrl}/backoffice/profiles`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<Profile>> {
    return this.http.get<PaginatedResponse<Profile>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.base}/${id}`);
  }

  create(payload: ProfilePayload): Observable<Profile> {
    return this.http.post<Profile>(this.base, payload);
  }

  update(id: string, payload: ProfilePayload): Observable<Profile> {
    return this.http.patch<Profile>(`${this.base}/${id}`, payload);
  }

  disable(id: string): Observable<Profile> {
    return this.http.patch<Profile>(`${this.base}/${id}/disable`, {});
  }

  enable(id: string): Observable<Profile> {
    return this.http.patch<Profile>(`${this.base}/${id}/enable`, {});
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
