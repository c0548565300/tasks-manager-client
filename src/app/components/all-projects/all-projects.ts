import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProjectsService } from '../../services/projects.service';
import { TeamsService } from '../../services/teams.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select'; // הוספנו
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu'; // לתפריט מחיקה

import { CreateProjectDialogComponent } from '../create-project-dialog/create-project-dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { Project } from '../../models/types.model';

@Component({
  selector: 'app-all-projects',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink, MatCardModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatProgressSpinnerModule, MatMenuModule
  ],
  templateUrl: './all-projects.html',
  styleUrl: './all-projects.css'
})
export class AllProjectsComponent implements OnInit {
  projectsService = inject(ProjectsService);
  teamsService = inject(TeamsService);
  private dialog = inject(MatDialog);

  searchQuery = signal<string>('');
  selectedTeamFilter = signal<number | null>(null); // null = כל הצוותים
  searchControl = new FormControl('');

  filteredProjects = computed(() => {
    const all = this.projectsService.myProjects();
    const text = this.searchQuery().toLowerCase();
    const teamId = this.selectedTeamFilter();

    return all.filter(p => {
      const matchesText = p.name.toLowerCase().includes(text);

      const matchesTeam = teamId ? p.team_id === teamId : true; 
      
      return matchesText && matchesTeam;
    });
  });

  ngOnInit() {
    this.projectsService.loadProjects();
    this.teamsService.loadTeams();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  clearSearch() {
    this.searchControl.setValue('');
    this.searchQuery.set('');
  }

  openCreateProjectDialog() {
    this.dialog.open(CreateProjectDialogComponent, {
      width: '400px',
      direction: 'rtl'
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