import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PermissionCatalog } from '../models/permission.model';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private readonly base = `${environment.apiUrl}/backoffice/permissions`;

  constructor(private readonly http: HttpClient) {}

  catalog(): Observable<PermissionCatalog> {
    return this.http.get<PermissionCatalog>(this.base);
  }
}
