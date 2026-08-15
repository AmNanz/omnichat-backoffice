import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ListQuery, PaginatedResponse } from '../models/common.model';
import { Subscription, SubscriptionPayload } from '../models/subscription.model';
import { toHttpParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private readonly base = `${environment.apiUrl}/backoffice/subscriptions`;

  constructor(private readonly http: HttpClient) {}

  list(query: ListQuery = {}): Observable<PaginatedResponse<Subscription>> {
    return this.http.get<PaginatedResponse<Subscription>>(this.base, {
      params: toHttpParams(query),
    });
  }

  get(id: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.base}/${id}`);
  }

  create(payload: SubscriptionPayload): Observable<Subscription> {
    return this.http.post<Subscription>(this.base, payload);
  }

  update(id: string, payload: SubscriptionPayload): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.base}/${id}`, payload);
  }

  enable(id: string): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.base}/${id}/enable`, {});
  }

  disable(id: string): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.base}/${id}/disable`, {});
  }

  remove(id: string): Observable<unknown> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
