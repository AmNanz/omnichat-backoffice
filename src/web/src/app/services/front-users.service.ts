import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FrontUser } from '../models/front-user.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class FrontUsersService {
  private readonly base = `${environment.apiUrl}/backoffice/front-users`;

  constructor(private readonly http: HttpClient) {}

  list(search = ''): Observable<{ items: FrontUser[] }> {
    return this.http.get<{ items: FrontUser[] }>(this.base, {
      params: toHttpParams({ search, limit: 100 }),
    });
  }
}
