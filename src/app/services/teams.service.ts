import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { 
  Team, 
  CreateTeamPayload,
  TeamMember,
  AddMemberPayload,
  UserListItem
} from '../models/types.model';
import { ToastService } from './toast.service';
import { tap, catchError, throwError, finalize } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/teams`;
  private usersApiUrl = `${environment.apiUrl}/users`;

  myTeams = signal<Team[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  allUsers = signal<UserListItem[]>([]);
  currentTeamMembers = signal<TeamMember[]>([]);

  loadTeams() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<Team[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.myTeams.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error(err);
        const msg = 'לא הצלחנו לטעון את הצוותים';
        this.error.set(msg);
        this.toastService.showError(msg);
        this.isLoading.set(false);
      }
    });
  }

  addTeam(payload: CreateTeamPayload) {
    this.isLoading.set(true);

    return this.http.post<Team>(this.apiUrl, payload).pipe(
      tap((newTeam) => {
        this.myTeams.update(currentTeams => [...currentTeams, newTeam]);
        this.toastService.showSuccess(`צוות "${newTeam.name}" נוצר בהצלחה!`);
      }),
      catchError((err) => {
        this.toastService.showError('שגיאה ביצירת הצוות');
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  addMember(teamId: number, userId: number, role: string = 'member') {
    return this.http.post(`${this.apiUrl}/${teamId}/members`, { userId, role }).pipe(
      tap(() => {
        this.toastService.showSuccess('המשתמש צורף לצוות בהצלחה');
        this.loadTeams();
      }),
      catchError((err) => {
        if (err.status !== 403) {
            this.toastService.showError('לא ניתן לצרף את המשתמש');
        }
        return throwError(() => err);
      })
    );
  }

  loadAllUsers() {
    this.isLoading.set(true);

    this.http.get<UserListItem[]>(this.usersApiUrl).subscribe({
      next: (data) => {
        this.allUsers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.toastService.showError('שגיאה בטעינת רשימת המשתמשים');
        this.isLoading.set(false);
      }
    });
  }

  loadTeamMembers(teamId: number) {
    this.isLoading.set(true);
    this.currentTeamMembers.set([]);

    this.http.get<TeamMember[]>(`${this.apiUrl}/${teamId}/members`).subscribe({
      next: (data) => {
        this.currentTeamMembers.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading team members:', err);
        this.toastService.showError('שגיאה בטעינת חברי הצוות');
        this.isLoading.set(false);
      }
    });
  }

  addMemberNew(teamId: number, payload: AddMemberPayload) {
    return this.http.post(`${this.apiUrl}/${teamId}/members`, payload).pipe(
      tap(() => {
        this.toastService.showSuccess('המשתמש צורף לצוות בהצלחה! 🎉');
        this.loadTeamMembers(teamId);
        this.loadTeams();
      }),
      catchError((err) => {
        if (err.status === 403) {
          this.toastService.showError('רק בעלי הצוות יכולים להוסיף חברים');
        } else if (err.status === 400) {
          this.toastService.showError(err.error?.message || 'המשתמש כבר חבר בצוות');
        } else {
          this.toastService.showError('שגיאה בהוספת החבר לצוות');
        }
        return throwError(() => err);
      })
    );
  }
  deleteTeam(teamId: number) {
    this.isLoading.set(true);

    return this.http.delete(`${this.apiUrl}/${teamId}`).pipe(
      tap(() => {
        this.toastService.showSuccess('הצוות נמחק בהצלחה');
        
        this.myTeams.update(teams => teams.filter(t => t.id !== teamId));
      }),
      catchError((err) => {
        if (err.status === 403) {
          this.toastService.showError('אין לך הרשאה למחוק את הצוות הזה');
        } else {
          this.toastService.showError('שגיאה במחיקת הצוות, נסה שוב מאוחר יותר');
        }
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }
  clearCurrentMembers() {
    this.currentTeamMembers.set([]);
  }
}