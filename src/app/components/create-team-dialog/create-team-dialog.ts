import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-create-team-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-team-dialog.html',
  styleUrls: ['./create-team-dialog.css']
})
export class CreateTeamDialogComponent {
  private dialogRef = inject(MatDialogRef<CreateTeamDialogComponent>);
  private teamsService = inject(TeamsService);

  teamName = signal('');
  isSubmitting = signal(false);

  onCreate() {
    if (!this.teamName().trim()) return;

    this.isSubmitting.set(true);

    this.teamsService.addTeam({ name: this.teamName() }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }
}