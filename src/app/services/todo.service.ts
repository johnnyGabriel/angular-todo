import { Injectable, signal, computed, effect } from '@angular/core';
import { Todo, Priority, Filter, TodoStatus } from '../models/todo.model';

const STORAGE_KEY = 'ng-todos';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private _todos = signal<Todo[]>(this._load());
  private _filter = signal<Filter>('all');
  private _editingId = signal<string | null>(null);

  readonly todos = this._todos.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly editingId = this._editingId.asReadonly();

  readonly filteredTodos = computed(() => {
    const f = this._filter();
    return this._todos().filter(t => {
      if (f === 'active') return t.status === 'active';
      if (f === 'completed') return t.status === 'completed';
      if (f === 'blocked') return t.status === 'blocked';
      return true;
    });
  });

  readonly activeCount = computed(() => this._todos().filter(t => t.status === 'active').length);
  readonly totalCount = computed(() => this._todos().length);
  readonly completedCount = computed(() => this._todos().filter(t => t.status === 'completed').length);
  readonly blockedCount = computed(() => this._todos().filter(t => t.status === 'blocked').length);
  readonly remainingCount = computed(() => this._todos().filter(t => t.status !== 'completed').length);

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._todos()));
    });
  }

  add(title: string, description: string, priority: Priority, dueDate?: string): void {
    const todo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate || undefined,
      status: 'active',
      createdAt: Date.now(),
    };
    this._todos.update(ts => [todo, ...ts]);
  }

  update(id: string, changes: Partial<Omit<Todo, 'id' | 'createdAt'>>): void {
    this._todos.update(ts => ts.map(t => t.id === id ? { ...t, ...changes } : t));
  }

  remove(id: string): void {
    this._todos.update(ts => ts.filter(t => t.id !== id));
  }

  toggle(id: string): void {
    this._todos.update(ts => ts.map(t => t.id === id
      ? {
          ...t,
          status: t.status === 'completed' ? 'active' : 'completed',
          blockReason: undefined,
        }
      : t));
  }

  block(id: string, reason: string): void {
    const blockReason = reason.trim();
    if (!blockReason) return;
    this._todos.update(ts => ts.map(t => t.id === id && t.status !== 'completed'
      ? { ...t, status: 'blocked', blockReason }
      : t));
  }

  unblock(id: string): void {
    this._todos.update(ts => ts.map(t => t.id === id
      ? { ...t, status: 'active', blockReason: undefined }
      : t));
  }

  clearCompleted(): void {
    this._todos.update(ts => ts.filter(t => t.status !== 'completed'));
  }

  setFilter(f: Filter): void {
    this._filter.set(f);
  }

  startEdit(id: string): void {
    this._editingId.set(id);
  }

  stopEdit(): void {
    this._editingId.set(null);
  }

  private _load(): Todo[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Array<Todo & { completed?: boolean }>).map(todo => {
        const { completed, ...currentTodo } = todo;
        return {
          ...currentTodo,
          status: todo.status ?? (completed ? 'completed' : 'active'),
          blockReason: todo.status === 'blocked' ? todo.blockReason : undefined,
        };
      }) : this._demo();
    } catch {
      return this._demo();
    }
  }

  private _demo(): Todo[] {
    return [
      {
        id: crypto.randomUUID(),
        title: 'Design the UI mockups',
        description: 'Create wireframes for all screens',
        priority: 'high',
        status: 'active',
        createdAt: Date.now() - 86400000,
      },
      {
        id: crypto.randomUUID(),
        title: 'Set up Angular project',
        description: 'Initialize app with routing and SCSS',
        priority: 'high',
        status: 'completed',
        createdAt: Date.now() - 172800000,
      },
      {
        id: crypto.randomUUID(),
        title: 'Write unit tests',
        priority: 'medium',
        status: 'active',
        createdAt: Date.now() - 43200000,
      },
      {
        id: crypto.randomUUID(),
        title: 'Deploy to production',
        description: 'Configure CI/CD pipeline',
        priority: 'low',
        status: 'blocked',
        createdAt: Date.now() - 21600000,
        dueDate: '2026-08-20',
      },
    ];
  }
}
