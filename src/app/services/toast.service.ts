import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private snackBar = inject(MatSnackBar);

  showSuccess(message: string, duration: number = 3000) {
    this.snackBar.open(message, 'סגור', {
      duration, 
      horizontalPosition: 'center', 
      verticalPosition: 'top',     
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string, duration: number = 4000) {
    this.snackBar.open(message, 'סגור', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  showWarning(message: string, duration: number = 3500) {
    this.snackBar.open(message, 'סגור', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['warning-snackbar']
    });
  }

  showInfo(message: string, duration: number = 3000) {
    this.snackBar.open(message, 'סגור', {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['info-snackbar']
    });
  }
}