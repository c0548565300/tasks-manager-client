import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Task, CreateTaskPayload } from '../models/types.model';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { tap, catchError, throwError, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  
  private apiUrl = `${environment.apiUrl}/tasks`;

  myTasks = signal<Task[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadTasks(projectId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<Task[]>(this.apiUrl, { 
      params: { projectId: projectId.toString() } 
    }).subscribe({
      next: (data) => {
        this.myTasks.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        const errorMsg = 'לא הצלחנו לטעון את המשימות';
        this.error.set(errorMsg);
        

        if (err.status && err.status >= 400 && err.status < 500 && err.status !== 401 && err.status !== 403 && err.status !== 404) {
          this.toastService.showError(errorMsg);
        }
        
        this.isLoading.set(false);
      }
    });
  }

  addTask(payload: CreateTaskPayload) {
    this.isLoading.set(true);
    
    const currentUserId = this.authService.currentUser()?.id;
    
    const body: CreateTaskPayload = {
      ...payload,
      assigneeId: payload.assigneeId || currentUserId,
      orderIndex: payload.orderIndex || 0
    };

    return this.http.post<Task>(this.apiUrl, body).pipe(
      tap((newTask) => {

        this.myTasks.update(list => [...list, newTask]);
        this.toastService.showSuccess('המשימה נוצרה בהצלחה! 🎉');
      }),
      catchError((err) => {

        if (err.status === 400 || err.status === 422) {
          const errorMsg = err.error?.message || 'שגיאה ביצירת המשימה - נתונים לא תקינים';
          this.toastService.showError(errorMsg);
        }
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  } 

  deleteTask(taskId: number) {
    return this.http.delete(`${this.apiUrl}/${taskId}`).pipe(
      tap(() => {
        this.myTasks.update(tasks => tasks.filter(t => t.id !== taskId));
        this.toastService.showSuccess('המשימה נמחקה בהצלחה 🗑️');
      }),
      catchError((err) => {
        if (err.status === 400 || err.status === 422) {
          const errorMsg = err.error?.message || 'שגיאה במחיקת המשימה';
          this.toastService.showError(errorMsg);
        }
        return throwError(() => err);
      })
    );
  }

  updateTask(taskId: number, changes: Partial<CreateTaskPayload>) {
    return this.http.patch<Task>(`${this.apiUrl}/${taskId}`, changes).pipe(
      tap((updatedTask) => {
        this.myTasks.update(tasks => 
          tasks.map(t => t.id === taskId ? updatedTask : t)
        );
        this.toastService.showSuccess('המשימה עודכנה בהצלחה ✅');
      }),
      catchError((err) => {
        if (err.status === 400 || err.status === 422) {
          const errorMsg = err.error?.message || 'שגיאה בעדכון המשימה - נתונים לא תקינים';
          this.toastService.showError(errorMsg);
        }
        return throwError(() => err);
      })
    );
  }
}