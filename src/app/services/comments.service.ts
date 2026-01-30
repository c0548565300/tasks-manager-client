import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Comment } from '../models/types.model';
import { ToastService } from './toast.service';
import { tap, catchError, throwError, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/comments`;

  currentComments = signal<Comment[]>([]);
  isLoading = signal<boolean>(false);

  loadComments(taskId: number) {
    this.isLoading.set(true);
    this.currentComments.set([]);

    this.http.get<Comment[]>(this.apiUrl, { 
      params: { taskId: taskId.toString() } 
    }).subscribe({
      next: (data) => {
        this.currentComments.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading comments:', err);
        

        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 403 && err.status !== 404) {
          this.toastService.showError('שגיאה בטעינת התגובות');
        }
        
        this.isLoading.set(false);
      }
    });
  }

  addComment(taskId: number, body: string) {
    if (!body || body.trim().length === 0) {
      this.toastService.showError('לא ניתן לשלוח תגובה ריקה');
      return throwError(() => new Error('Empty comment'));
    }

    this.isLoading.set(true);
    
    const payload = { taskId, body: body.trim() };

    return this.http.post<Comment>(this.apiUrl, payload).pipe(
      tap((newComment) => {
        this.currentComments.update(list => [...list, newComment]);
        this.toastService.showSuccess('התגובה נוספה בהצלחה!');
      }),
      catchError((err) => {
        if (err.status === 400 || err.status === 422) {
          const errorMsg = err.error?.message || 'שגיאה בשליחת התגובה - נתונים לא תקינים';
          this.toastService.showError(errorMsg);
        }
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }


  clearComments() {
    this.currentComments.set([]);
  }
}