import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink ,RouterLinkActive} from '@angular/router'; 
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authService = inject(AuthService);
  title = 'task-manager';
}