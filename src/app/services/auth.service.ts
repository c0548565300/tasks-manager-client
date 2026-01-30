import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, catchError, throwError } from 'rxjs';
import { AuthResponse, User, LoginPayload, RegisterPayload } from '../models/types.model';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router); 
  private toastService = inject(ToastService);
  
  private apiUrl = `${environment.apiUrl}/auth`;
  
  currentUser = signal<User | null>(null);
  
  isAuthenticated = computed(() => !!this.currentUser());

  constructor() {
    this.restoreUserFromStorage();
  }

  login(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, payload).pipe(
      tap((response) => {
        if (response.token && response.user) {
          this.handleAuthSuccess(response);
          this.toastService.showSuccess('התחברת בהצלחה!');
        }
      }),
      catchError((err) => {
        this.toastService.showError('שגיאה בהתחברות: אימייל או סיסמה שגויים');
        return throwError(() => err);
      })
    );
  }

  register(payload: RegisterPayload) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => {
        if (response.token && response.user) {
          this.handleAuthSuccess(response);
          this.toastService.showSuccess('נרשמת בהצלחה! ברוך הבא');
        }
      }),
      catchError((err) => {
        this.toastService.showError('שגיאה בהרשמה (אולי האימייל כבר קיים?)');
        return throwError(() => err);
      })
    );
  }

  logout() {
    sessionStorage.removeItem('token'); 
    sessionStorage.removeItem('user');
    
    this.currentUser.set(null);
    
    this.router.navigate(['/login']); 
    this.toastService.showSuccess('התנתקת בהצלחה');
  }

  private handleAuthSuccess(response: AuthResponse) {
    sessionStorage.setItem('token', response.token);
    sessionStorage.setItem('user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  private restoreUserFromStorage() {
    const token = sessionStorage.getItem('token');
    const userString = sessionStorage.getItem('user');

    if (token && userString) {
      try {
        const user = JSON.parse(userString) as User;
        this.currentUser.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }
  
  getToken(): string | null {
    return sessionStorage.getItem('token');
  }
}