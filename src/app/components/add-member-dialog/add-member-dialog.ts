import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamsService } from '../../services/teams.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './add-member-dialog.html',
  styleUrls: ['./add-member-dialog.css']
})
export class AddMemberDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<AddMemberDialogComponent>);
  private data: { teamId: number } = inject(MAT_DIALOG_DATA);
  private toastService = inject(ToastService);
  
  teamsService = inject(TeamsService);

  selectedUserId: number | null = null;
  selectedRole: 'member' | 'owner' = 'member';
  
  isSubmitting = signal(false);

  ngOnInit() {
    // 1. טעינת כל המשתמשים (בשביל ה-Select)
    this.teamsService.loadAllUsers();
    
    // 2. טעינת חברי הצוות הנוכחי (כדי לדעת את מי לא להציג)
    this.teamsService.loadTeamMembers(this.data.teamId);
  }

  ngOnDestroy() {
    // ✅ התיקון: שימוש בשם הפונקציה המדויק שמופיע ב-Service שלך
    this.teamsService.clearCurrentMembers();
  }
availableUsers = computed(() => {
    const allUsers = this.teamsService.allUsers();
    const currentMembers = this.teamsService.currentTeamMembers();

    if (!allUsers || allUsers.length === 0) return [];
    if (!currentMembers) return allUsers;

    // --- דיבוג: בואי נראה מה השרת באמת מחזיר ---
    // תפתחי את ה-F12 בלשונית Console ותראי מה מודפס כאן
    if (currentMembers.length > 0) {
      console.log('🔍 מבנה של חבר צוות מהשרת:', currentMembers[0]);
    }
    // ---------------------------------------------

    return allUsers.filter(user => {
      // אנחנו בודקים אם היוזר הזה קיים בצוות
      const isInTeam = currentMembers.some(member => {
        // המרה ל-any כדי לעקוף את הטייפסקריפט זמנית ולבדוק את כל האפשרויות
        const m = member as any;
        
        // בדיקה 1: לפי user_id (כמו ב-Interface שלך)
        if (m.user_id === user.id) return true;
        
        // בדיקה 2: לפי userId (נפוץ מאוד בשרתים)
        if (m.userId === user.id) return true;
        
        // בדיקה 3: אם השרת מחזיר את היוזר עצמו
        if (m.id === user.id) return true;

        // בדיקה 4: המרה למחרוזות (למקרה שאחד number ואחד string)
        if (String(m.user_id) === String(user.id)) return true;
        if (String(m.userId) === String(user.id)) return true;

        return false;
      });

      // נחזיר את המשתמש לרשימה רק אם הוא *לא* נמצא בצוות
      return !isInTeam;
    });
  });

  onAdd() {
    if (!this.selectedUserId) return;

    this.isSubmitting.set(true);

    // קריאה לפונקציה החדשה ב-Service שלך
    this.teamsService.addMemberNew(this.data.teamId, {
      userId: this.selectedUserId,
      role: this.selectedRole
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        // ה-Service כבר מקפיץ Toast של הצלחה, אז אין צורך לעשות זאת שוב כאן
        // סוגרים את הדיאלוג עם ערך 'true' כדי לסמן שהייתה הוספה
        this.dialogRef.close(true); 
      },
      error: (err) => {
        this.isSubmitting.set(false);
        console.error(err);
        // ה-Service כבר מטפל בהודעות שגיאה
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}