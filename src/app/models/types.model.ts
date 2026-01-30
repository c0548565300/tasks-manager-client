
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string; 
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Team {
  id: number; 
  name: string;
  created_at?: string; 
  members_count?: number; 
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  team_id: number; 
  status?: string;
  created_at?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high';
  project_id: number;   
  assignee_id?: number;
  due_date?: string;    
  order_index?: number; 
}

export interface Comment {
  id: number;
  task_id: string | number; 
  user_id: number;
  body: string;
  created_at: string;
  author_name: string;
}



export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
}

export interface CreateTeamPayload {
  name: string;
}

export interface CreateProjectPayload {
  teamId: number; 
  name: string;
  description?: string;
}

export interface CreateTaskPayload {
  projectId: number;  
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'normal' | 'high';
  assigneeId?: number;
  dueDate?: string;
  orderIndex?: number;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: 'owner' | 'member'; 
  joined_at: string;
  user_name?: string; 
  user_email?: string;
}

export interface AddMemberPayload {
  userId: number; 
  role?: 'owner' | 'member'; 
}

export interface UserListItem {
  id: number;
  name: string;
  email: string;
}