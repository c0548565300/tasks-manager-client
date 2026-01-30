import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select'; // <-- חשוב לבחירת צוות
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectsService } from '../../services/projects.service';
import { TeamsService } from '../../services/teams.service'; // <-- צריך את זה כדי לטעון צוותים

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule
  ],
  templateUrl: './create-project-dialog.html',
  styleUrls: ['./create-project-dialog.css']
})
export class CreateProjectDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateProjectDialogComponent>);
  private projectsService = inject(ProjectsService);
  public teamsService = inject(TeamsService);

  name = signal('');
  description = signal('');
  selectedTeamId = signal<number | null>(null);
  isSubmitting = signal(false);

  ngOnInit() {

    this.teamsService.loadTeams();
  }

  onCreate() {
    if (!this.name() || !this.selectedTeamId()) return;

    this.isSubmitting.set(true);

    this.projectsService.addProject({
      name: this.name(),
      description: this.description(),
      teamId: this.selectedTeamId()!
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.dialogRef.close(true);
      },
      error: () => this.isSubmitting.set(false)
    });
  }
}