import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Project, CreateProjectPayload } from '../models/types.model';
import { ToastService } from './toast.service';
import { tap, catchError, throwError, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProjectsService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/projects`;
  
  myProjects = signal<Project[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  loadProjects() {
    this.isLoading.set(true);
    this.error.set(null); 

    this.http.get<Project[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.myProjects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        const msg = 'שגיאה בטעינת פרויקטים';
        this.error.set(msg);
        this.toastService.showError(msg);
        this.isLoading.set(false);
      }
    });
  }

  addProject(payload: CreateProjectPayload) {
    this.isLoading.set(true);

    return this.http.post<Project>(this.apiUrl, payload).pipe(
      tap((newProject) => {
        this.myProjects.update(list => [...list, newProject]);
        this.toastService.showSuccess(`פרויקט "${newProject.name}" נוצר בהצלחה!`);
      }),
      catchError((err) => {
        this.toastService.showError('שגיאה ביצירת הפרויקט');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
  deleteProject(projectId: number) {
    this.isLoading.set(true);
    return this.http.delete(`${this.apiUrl}/${projectId}`).pipe(
      tap(() => {
        this.toastService.showSuccess('הפרויקט נמחק בהצלחה');
        this.myProjects.update(list => list.filter(p => p.id !== projectId));
      }),
      catchError(err => {
        this.toastService.showError('שגיאה במחיקת הפרויקט');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
}