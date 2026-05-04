import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../models/auth/auth-response';
import { LoginRequest } from '../../models/auth/login-request';
import { RegisterRequest } from '../../models/auth/register-request';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.tokenService.setToken(response.token);
          this.tokenService.setUser(response.user);
        })
      );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        tap(response => {
          this.tokenService.setToken(response.token);
          this.tokenService.setUser(response.user);
        })
      );
  }

  /** Alta de usuario sin reemplazar la sesión actual (panel de administración). */
  registerSystemUser(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data);
  }

  logout(): void {
    this.tokenService.removeToken();
  }

  isLoggedIn(): boolean {
    return this.tokenService.isLoggedIn();
  }

  getCurrentUser() {
    return this.tokenService.getUser();
  }
}
