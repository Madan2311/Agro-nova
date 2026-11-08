import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, RegisterData, User } from './auth.models';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.store.setSession(res.access_token, res.user)));
  }

  logout(): void {
    this.store.clear();
    this.router.navigate(['/login']);
  }

  register(data: RegisterData): Observable<LoginResponse> {
    return this.http
      .post<User>(`${environment.apiUrl}/auth/register`, data)
      .pipe(switchMap(() => this.login(data.email, data.password)));
  }
}