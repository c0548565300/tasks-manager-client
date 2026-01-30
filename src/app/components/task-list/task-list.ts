import { Component, OnInit, computed, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';

import { TasksService } from '../../services/tasks.service';
import { CommentsService } from '../../services/comments.service';
import { ProjectsService } from '../../services/projects.service';
import { TeamsService } from '../../services/teams.service';
import { Task, CreateTaskPayload } from '../../models/types.model';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DragDropModule, MatButtonModule,
    MatCardModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatDialogModule, MatMenuModule, MatDatepickerModule, 
    MatNativeDateModule, DatePipe, MatProgressSpinnerModule
  ],
  templateUrl: './task-list.html',
  styleUrl: './task-list.css'
})
export class TaskList implements OnInit {
  public tasksService = inject(TasksService);
  public commentsService = inject(CommentsService);
  private projectsService = inject(ProjectsService);
  private teamsService = inject(TeamsService);
  private route = inject(ActivatedRoute);
  public dialog = inject(MatDialog);

  @ViewChild('taskDialog') taskDialog!: TemplateRef<any>;
  @ViewChild('deleteConfirmDialog') deleteConfirmDialog!: TemplateRef<any>;
  
  projectId = signal<number>(0);
  searchQuery = signal('');
  editingTask = signal<Task | null>(null);
  taskToDelete: Task | null = null;

  columns = [
    { id: 'todo', title: 'לביצוע' },
    { id: 'in_progress', title: 'בתהליך' },
    { id: 'done', title: 'בוצע' }
  ];

  todoTasks = computed(() => this.getFilteredTasks('todo'));
  inProgressTasks = computed(() => this.getFilteredTasks('in_progress'));
  doneTasks = computed(() => this.getFilteredTasks('done'));

  currentTeamName = computed(() => {
    const project = this.projectsService.myProjects().find(p => p.id === this.projectId());
    if (!project) return 'טוען...';
    const team = this.teamsService.myTeams().find(t => t.id === project.team_id);
    return team ? team.name : 'צוות כללי';
  });

  taskForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    priority: new FormControl<'low' | 'normal' | 'high'>('normal'),
    due_date: new FormControl(''),
    status: new FormControl<'todo' | 'in_progress' | 'done'>('todo')
  });

  commentControl = new FormControl('');

  ngOnInit() {
    this.projectsService.loadProjects();
    this.teamsService.loadTeams();
    const id = this.route.snapshot.paramMap.get('projectId');
    if (id) {
      this.projectId.set(Number(id));
      this.tasksService.loadTasks(Number(id));
    }
  }

  /**
   * סינון משימות לפי סטטוס וחיפוש
   */
  getFilteredTasks(status: string) {
    const query = this.searchQuery().toLowerCase().trim();
    return this.tasksService.myTasks().filter(t => {
      const matchesStatus = t.status === status;
      const matchesSearch = query === '' || 
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.item.data as Task;
      const newStatus = event.container.id as 'todo' | 'in_progress' | 'done';
      

      const previousStatus = task.status;
      task.status = newStatus;
      transferArrayItem(
        event.previousContainer.data, 
        event.container.data, 
        event.previousIndex, 
        event.currentIndex
      );
      
      this.tasksService.updateTask(task.id, { status: newStatus }).subscribe({
        error: () => {
          task.status = previousStatus;
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
        }
      });
    }
  }


  openTaskModal(task?: Task) {
    if (task) {
      this.editingTask.set(task);
      this.taskForm.patchValue({
        title: task.title,
        description: task.description,
        priority: task.priority,
        due_date: task.due_date,
        status: task.status
      });
      this.commentsService.loadComments(task.id);
    } else {
      this.editingTask.set(null);
      this.taskForm.reset({ priority: 'normal', status: 'todo' });
    }
    
    this.dialog.open(this.taskDialog, { 
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-modal-box',
      direction: 'rtl' 
    });
  }

  confirmDelete(task: Task, event: MouseEvent) {
    event.stopPropagation();
    this.taskToDelete = task;
    this.dialog.open(this.deleteConfirmDialog, { 
      width: '350px', 
      direction: 'rtl' 
    }).afterClosed().subscribe(confirmed => {
      if (confirmed && this.taskToDelete) {
        this.tasksService.deleteTask(this.taskToDelete.id).subscribe();
      }
    });
  }

  updatePriority(task: Task, priority: any, event: MouseEvent) {
    event.stopPropagation();
    this.tasksService.updateTask(task.id, { priority }).subscribe();
  }

  saveTask() {
    if (this.taskForm.invalid) return;
    
    const val = this.taskForm.value;
    const payload: CreateTaskPayload = {
      projectId: this.projectId(),
      title: val.title!,
      description: val.description || '',
      priority: val.priority!,
      status: val.status!,
      dueDate: val.due_date || undefined
    };
    
    const req = this.editingTask() 
      ? this.tasksService.updateTask(this.editingTask()!.id, payload) 
      : this.tasksService.addTask(payload);
    
    req.subscribe(() => this.dialog.closeAll());
  }

  sendComment() {
    const commentText = this.commentControl.value?.trim();
    if (!commentText || !this.editingTask()) return;
    
    this.commentsService.addComment(this.editingTask()!.id, commentText).subscribe(() => {
      this.commentControl.reset();
    });
  }

  retryLoadTasks() {
    this.tasksService.loadTasks(this.projectId());
  }

  getEmptyIcon(columnId: string): string {
    const icons: Record<string, string> = {
      'todo': 'inbox',
      'in_progress': 'play_circle_outline',
      'done': 'check_circle_outline'
    };
    return icons[columnId] || 'inbox';
  }

  getEmptyMessage(columnId: string): string {
    const query = this.searchQuery().trim();
    
    if (query) {
      return 'לא נמצאו משימות תואמות';
    }

    const messages: Record<string, string> = {
      'todo': 'אין משימות לביצוע כרגע',
      'in_progress': 'אין משימות בתהליך',
      'done': 'אין משימות שהושלמו'
    };
    return messages[columnId] || 'אין משימות';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'low': 'נמוכה',
      'normal': 'רגילה',
      'high': 'גבוהה'
    };
    return labels[priority] || priority;
  }
}