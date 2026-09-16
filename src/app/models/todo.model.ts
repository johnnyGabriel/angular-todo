export type Priority = 'low' | 'medium' | 'high';
export type TodoStatus = 'active' | 'completed' | 'blocked';
export type Filter = 'all' | 'active' | 'completed' | 'blocked';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  status: TodoStatus;
  blockReason?: string;
  createdAt: number;
}
