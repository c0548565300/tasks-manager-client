import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service'; 

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);
  const token = sessionStorage.getItem('token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const serverMessage = err.error?.message || err.message;

      if (err.status === 0) {
        toastService.showError('בעיית חיבור לאינטרנט, אנא בדוק את החיבור שלך');
      }
      
      else if (err.status === 401) {
        toastService.showError('פג תוקף החיבור, נא להתחבר מחדש');
        sessionStorage.removeItem('token');
        router.navigate(['/login']);
      }

      else if (err.status === 403) {
        toastService.showError(serverMessage || 'אין לך הרשאה לבצע פעולה זו');
      }

      else if (err.status === 404) {
        toastService.showError('הפריט המבוקש לא נמצא');
      }

      return throwError(() => err);
    })
  );
};