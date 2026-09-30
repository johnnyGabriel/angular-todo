import '@angular/compiler';
import { signal, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';
import { TodoItemComponent } from './todo-item.component';


describe('TodoItemComponent', () => {
  let service: {
    editingId: ReturnType<typeof signal<string | null>>;
    startEdit: ReturnType<typeof vi.fn>;
    stopEdit: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    toggle: ReturnType<typeof vi.fn>;
    block: ReturnType<typeof vi.fn>;
    unblock: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let component: TodoItemComponent;
  let todo: Todo;

  beforeEach(() => {
    service = {
      editingId: signal<string | null>(null),
      startEdit: vi.fn(),
      stopEdit: vi.fn(),
      update: vi.fn(),
      toggle: vi.fn(),
      block: vi.fn(),
      unblock: vi.fn(),
      remove: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TodoService, useValue: service },
      ],
    });
    component = TestBed.runInInjectionContext(() => new TodoItemComponent());
    todo = {
      id: 'todo-1',
      title: 'Write tests',
      description: 'Cover the task item',
      priority: 'high',
      dueDate: '2026-10-01',
      status: 'active',
      createdAt: 1,
    };
    component.todo = todo;
  });

  afterEach(() => TestBed.resetTestingModule());

  it('loads the current task into the edit form and begins editing', () => {
    component.startEdit();

    expect(component.editForm.getRawValue()).toEqual({
      title: 'Write tests',
      description: 'Cover the task item',
      priority: 'high',
      dueDate: '2026-10-01',
    });
    expect(service.startEdit).toHaveBeenCalledWith('todo-1');
  });

  it('does not save an invalid edit and marks the form as touched', () => {
    component.editForm.setValue({ title: ' ', description: '', priority: 'medium', dueDate: '' });

    component.saveEdit();

    expect(service.update).not.toHaveBeenCalled();
    expect(service.stopEdit).not.toHaveBeenCalled();
    expect(component.editForm.get('title')?.touched).toBe(true);
  });

  it('saves valid edits and converts blank optional fields to undefined', () => {
    component.editForm.setValue({ title: 'Updated title', description: '   ', priority: 'low', dueDate: '' });

    component.saveEdit();

    expect(service.update).toHaveBeenCalledWith('todo-1', {
      title: 'Updated title',
      description: undefined,
      priority: 'low',
      dueDate: undefined,
    });
    expect(service.stopEdit).toHaveBeenCalledOnce();
  });

  it('requires a blocker reason before confirming a block', () => {
    component.startBlocking();
    component.confirmBlocking();

    expect(service.block).not.toHaveBeenCalled();
    expect((component as any).blockError).toBe(true);
  });

  it('delegates block, unblock, toggle, and delete actions to the service', () => {
    component.startBlocking();
    (component as any).blockerReason = 'Waiting for review';
    component.confirmBlocking();
    component.toggle();
    component.unblock();
    component.confirmDel();

    expect(service.block).toHaveBeenCalledWith('todo-1', 'Waiting for review');
    expect(service.toggle).toHaveBeenCalledWith('todo-1');
    expect(service.unblock).toHaveBeenCalledWith('todo-1');
    expect(service.remove).toHaveBeenCalledWith('todo-1');
  });

  it('formats priority and dates and excludes completed tasks from overdue state', () => {
    expect(component.priorityLabel('high')).toBe('High');
    expect(component.formatDate('2026-10-01')).toBe('Oct 1, 2026');
    expect(component.formatDate()).toBe('');

    component.todo = { ...todo, status: 'completed' };
    expect(component.isOverdue('2000-01-01')).toBe(false);
  });
});