import { Injectable, signal, computed, effect } from '@angular/core';
import { Todo, Priority, Filter } from '../models/todo.model';

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
      if (f === 'active') return !t.completed;
      if (f === 'completed') return t.completed;
      return true;
    });
  });

  readonly activeCount = computed(() => this._todos().filter(t => !t.completed).length);
  readonly totalCount = computed(() => this._todos().length);
  readonly completedCount = computed(() => this._todos().filter(t => t.completed).length);

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
      completed: false,
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
    this._todos.update(ts => ts.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  clearCompleted(): void {
    this._todos.update(ts => ts.filter(t => !t.completed));
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
      return raw ? JSON.parse(raw) : this._demo();
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
        completed: false,
        createdAt: Date.now() - 86400000,
      },
      {
        id: crypto.randomUUID(),
        title: 'Set up Angular project',
        description: 'Initialize app with routing and SCSS',
        priority: 'high',
        completed: true,
        createdAt: Date.now() - 172800000,
      },
      {
        id: crypto.randomUUID(),
        title: 'Write unit tests',
        priority: 'medium',
        completed: false,
        createdAt: Date.now() - 43200000,
      },
      {
        id: crypto.randomUUID(),
        title: 'Deploy to production',
        description: 'Configure CI/CD pipeline',
        priority: 'low',
        completed: false,
        createdAt: Date.now() - 21600000,
        dueDate: '2026-08-20',
      },
    ];
  }
}
