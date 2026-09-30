import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoService } from '../../services/todo.service';
import { TodoFormComponent } from './todo-form.component';


describe('TodoFormComponent', () => {
  let add: ReturnType<typeof vi.fn>;
  let component: TodoFormComponent;

  beforeEach(() => {
    add = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TodoService, useValue: { add } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new TodoFormComponent());
  });

  afterEach(() => TestBed.resetTestingModule());

  it('does not add a task when the title is invalid', () => {
    component.submit();

    expect(add).not.toHaveBeenCalled();
    expect(component.formTree().touched()).toBe(true);
  });

  it('adds a valid task and resets the form state', () => {
    component.formData.set({
      title: 'Review pull request',
      description: 'Check edge cases',
      priority: 'high',
      dueDate: '2026-10-02',
    });
    component.toggle();

    component.submit();

    expect(add).toHaveBeenCalledOnce();
    expect(add).toHaveBeenCalledWith('Review pull request', 'Check edge cases', 'high', '2026-10-02');
    expect(component.formData()).toEqual({ title: '', description: '', priority: 'medium', dueDate: '' });
    expect((component as any).expanded()).toBe(false);
  });

  it('clears an unfinished draft when the form is collapsed', () => {
    component.toggle();
    component.formData.set({
      title: 'Draft task',
      description: 'Discard this',
      priority: 'low',
      dueDate: '2026-10-02',
    });

    component.toggle();

    expect(component.formData()).toEqual({ title: '', description: '', priority: 'medium', dueDate: '' });
    expect((component as any).expanded()).toBe(false);
  });
});