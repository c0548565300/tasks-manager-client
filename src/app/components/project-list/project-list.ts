import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { ProjectsService } from '../../services/projects.service';
import { TeamsService } from '../../services/teams.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Project } from '../../models/types.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    DatePipe, ReactiveFormsModule, RouterLink, 
    MatCardModule, MatButtonModule, MatIconModule, 
    MatInputModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './project-list.html',
  styleUrl: './project-list.css'
})
export class ProjectList implements OnInit {
  projectsService = inject(ProjectsService);
  teamsService = inject(TeamsService);
  toastService = inject(ToastService);
  dialog = inject(MatDialog);
  route = inject(ActivatedRoute);

  currentTeamId = signal<string>('');
  
  // --- הוספת סיגנל לחיפוש ---
  searchQuery = signal<string>('');
  searchControl = new FormControl('');

  isCreateOpen = signal(false);
  isSubmitting = signal(false);

  currentTeamName = computed(() => {
    const teamId = Number(this.currentTeamId());
    const team = this.teamsService.myTeams().find(t => t.id === teamId);
    return team ? team.name : 'טוען...';
  });

  // --- העדכון החשוב: סינון כפול (גם לפי צוות וגם לפי חיפוש) ---
  teamProjects = computed(() => {
    const allProjects = this.projectsService.myProjects();
    const teamId = this.currentTeamId(); 
    const query = this.searchQuery().toLowerCase();

    return allProjects.filter(p => {
      const isTeamMatch = String(p.team_id) === String(teamId);
      const isNameMatch = p.name.toLowerCase().includes(query);
      
      return isTeamMatch && isNameMatch;
    });
  });

  projectForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    description: new FormControl('')
  });

  ngOnInit() {
    this.projectsService.loadProjects();
    this.teamsService.loadTeams();

    this.route.paramMap.subscribe(params => {
      const id = params.get('teamId');
      if (id) {
        this.currentTeamId.set(id);
      }
    });
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.searchQuery.set('');
  }

  toggleCreate() {
    this.isCreateOpen.update(v => !v);
    if (!this.isCreateOpen()) {
      this.projectForm.reset();
    }
  }

  createProject() {
    if (this.projectForm.invalid) return;
    this.isSubmitting.set(true);
    const { name, description } = this.projectForm.value;
    const teamId = this.currentTeamId();

    this.projectsService.addProject({
      teamId: +teamId!,
      name: name || '',
      description: description || ''
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toggleCreate();
      },
      error: () => this.isSubmitting.set(false)
    });
  }

  deleteProject(project: Project) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      direction: 'rtl',
      data: {
        title: 'מחיקת פרויקט',
        message: `האם למחוק את פרויקט "${project.name}"?`,
        confirmText: 'מחק'
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) this.projectsService.deleteProject(project.id).subscribe();
    });
  }
}