import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, firstValueFrom, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, LoginPayload, LoginResponse } from '../models/auth.model';

const TOKEN_STORAGE_KEY = 'accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly isAuthenticated = signal(false);

  private sessionInitPromise: Promise<void> | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  initializeSession(): Promise<void> {
    if (!this.sessionInitPromise) {
      this.sessionInitPromise = this.restoreSession();
    }
    return this.sessionInitPromise;
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/backoffice/auth/login`, payload)
      .pipe(tap((response) => this.applyAuthResponse(response)));
  }

  me(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${environment.apiUrl}/backoffice/auth/me`).pipe(
      tap((user) => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.clearSession();
        }
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      this.http.post(`${environment.apiUrl}/backoffice/auth/logout`, {}).subscribe({
        error: () => undefined,
      });
    }
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    return !!user?.permissions?.includes(permission);
  }

  private applyAuthResponse(response: LoginResponse): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    this.currentUser.set(response.user);
    this.isAuthenticated.set(true);
  }

  private async restoreSession(): Promise<void> {
    if (!this.getToken()) {
      return;
    }
    try {
      await firstValueFrom(this.me());
    } catch {
      // Session cleared in me() only for 401 responses.
    }
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }
}
