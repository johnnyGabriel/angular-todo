import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;

  beforeEach(() => {
    localStorage.setItem('ng-todos', '[]');
    TestBed.configureTestingModule({
      providers: [TodoService, provideZonelessChangeDetection()],
    });
    service = TestBed.inject(TodoService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('adds a normalized task at the beginning of the list', () => {
    service.add('  Plan release  ', '  Write notes  ', 'high', '2026-10-01');

    expect(service.todos()).toHaveLength(1);
    expect(service.todos()[0]).toMatchObject({
      title: 'Plan release',
      description: 'Write notes',
      priority: 'high',
      dueDate: '2026-10-01',
      status: 'active',
    });

    service.add('Second task', '', 'low');
    expect(service.todos()[0].title).toBe('Second task');
    expect(service.todos()[0].description).toBeUndefined();
    expect(service.todos()[1].id).toBeTruthy();
  });

  it('updates and removes only the task with the matching id', () => {
    service.add('Keep', '', 'medium');
    service.add('Change', '', 'low');
    const [changedTask, keptTask] = service.todos();

    service.update(changedTask.id, { title: 'Changed' });
    expect(service.todos()[0].title).toBe('Changed');
    expect(service.todos()[1]).toEqual(keptTask);

    service.remove(changedTask.id);
    expect(service.todos()).toEqual([keptTask]);
  });

  it('toggles completion and clears a previous blocker', () => {
    service.add('Task', '', 'medium');
    const id = service.todos()[0].id;

    service.block(id, 'Waiting for review');
    service.toggle(id);
    expect(service.todos()[0]).toMatchObject({ status: 'completed', blockReason: undefined });

    service.toggle(id);
    expect(service.todos()[0].status).toBe('active');
  });

  it('blocks active tasks only when a reason is provided and can unblock them', () => {
    service.add('Task', '', 'medium');
    const id = service.todos()[0].id;

    service.block(id, '   ');
    expect(service.todos()[0].status).toBe('active');

    service.block(id, '  Waiting on access  ');
    expect(service.todos()[0]).toMatchObject({ status: 'blocked', blockReason: 'Waiting on access' });

    service.unblock(id);
    expect(service.todos()[0]).toMatchObject({ status: 'active', blockReason: undefined });
  });

  it('does not block completed tasks', () => {
    service.add('Task', '', 'medium');
    const id = service.todos()[0].id;
    service.toggle(id);

    service.block(id, 'Not applicable');

    expect(service.todos()[0].status).toBe('completed');
  });

  it('filters tasks and reports status counts', () => {
    service.add('Active', '', 'low');
    service.add('Completed', '', 'medium');
    service.add('Blocked', '', 'high');
    const [blockedId, completedId] = service.todos().map(todo => todo.id);
    service.block(blockedId, 'Dependency');
    service.toggle(completedId);

    expect(service.totalCount()).toBe(3);
    expect(service.activeCount()).toBe(1);
    expect(service.completedCount()).toBe(1);
    expect(service.blockedCount()).toBe(1);
    expect(service.remainingCount()).toBe(2);

    service.setFilter('blocked');
    expect(service.filteredTodos().map(todo => todo.title)).toEqual(['Blocked']);
    service.setFilter('all');
    expect(service.filteredTodos()).toHaveLength(3);
  });

  it('clears completed tasks and tracks the task being edited', () => {
    service.add('Keep', '', 'low');
    service.add('Remove', '', 'medium');
    const [completedId, keptTask] = service.todos().map(todo => todo.id);
    service.toggle(completedId);

    service.startEdit(keptTask);
    expect(service.editingId()).toBe(keptTask);
    service.stopEdit();
    expect(service.editingId()).toBeNull();

    service.clearCompleted();
    expect(service.todos().map(todo => todo.title)).toEqual(['Keep']);
  });

  it('loads legacy completed values into the current status field', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('ng-todos', JSON.stringify([
      { id: 'legacy', title: 'Old task', priority: 'low', completed: true, createdAt: 1 },
    ]));
    TestBed.configureTestingModule({
      providers: [TodoService, provideZonelessChangeDetection()],
    });
    service = TestBed.inject(TodoService);

    expect(service.todos()).toEqual([
      { id: 'legacy', title: 'Old task', priority: 'low', status: 'completed', createdAt: 1 },
    ]);
  });
});