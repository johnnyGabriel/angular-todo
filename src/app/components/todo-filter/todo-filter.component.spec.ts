import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TodoService } from '../../services/todo.service';
import { TodoFilterComponent } from './todo-filter.component';

describe('TodoFilterComponent', () => {
  let setFilter: ReturnType<typeof vi.fn>;
  let component: TodoFilterComponent;

  beforeEach(() => {
    setFilter = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TodoService, useValue: { setFilter } },
      ],
    });
    component = TestBed.runInInjectionContext(() => new TodoFilterComponent());
  });

  afterEach(() => TestBed.resetTestingModule());

  it('provides a tab for each supported task filter', () => {
    expect(component.tabs).toEqual([
      { label: 'All', value: 'all' },
      { label: 'Active', value: 'active' },
      { label: 'Completed', value: 'completed' },
      { label: 'Blocked', value: 'blocked' },
    ]);
  });

  it('passes the selected filter to the service', () => {
    component.setFilter('blocked');

    expect(setFilter).toHaveBeenCalledOnce();
    expect(setFilter).toHaveBeenCalledWith('blocked');
  });
});