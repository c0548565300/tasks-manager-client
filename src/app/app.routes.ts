import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { TeamList } from './components/team-list/team-list';
import { ProjectList } from './components/project-list/project-list';
import { TaskList } from './components/task-list/task-list';
import { AllProjectsComponent } from './components/all-projects/all-projects';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'teams', component: TeamList },
      
      { path: 'projects/:teamId', component: ProjectList }, 
      
      
      { path: 'all-projects', component: AllProjectsComponent },
      
      { path: 'projects/:projectId/tasks', component: TaskList } 
    ]
  },

  { path: '**', redirectTo: 'login' }
];