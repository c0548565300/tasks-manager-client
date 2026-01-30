import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; 
import { FormsModule } from '@angular/forms';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CreateTeamDialogComponent } from '../create-team-dialog/create-team-dialog';

import { TeamsService } from '../../services/teams.service';
import { Team } from '../../models/types.model';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog'; 

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './team-list.html',
  styleUrls: ['./team-list.css']
})
export class TeamList implements OnInit {
  teamsService = inject(TeamsService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  searchQuery = signal<string>('');


  filteredTeams = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const teams: Team[] = this.teamsService.myTeams();
    
    if (!query) return teams;
    return teams.filter((t: Team) => t.name.toLowerCase().includes(query));
  });

  ngOnInit() {
    this.teamsService.loadTeams();
  }

  navigateToProject(teamId: number) {
    this.router.navigate(['/projects', teamId]);
  }

  openAddMemberDialog(team: Team) {
    this.dialog.open(AddMemberDialogComponent, {
      data: { teamId: team.id },
      width: '400px'
    });
  }

  deleteTeam(team: Team) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      direction: 'rtl',
      data: { 
        title: 'מחיקת צוות',
        message: `האם את בטוחה שברצונך למחוק את צוות "${team.name}"?`,
        confirmText: 'מחק',
        cancelText: 'ביטול'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.teamsService.deleteTeam(team.id).subscribe();
      }
    });
  }

openCreateTeamDialog() {
    this.dialog.open(CreateTeamDialogComponent, {
      width: '400px',
      direction: 'rtl'
    });
}
}