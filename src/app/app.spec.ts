import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { TodoService } from './services/todo.service';

describe('App', () => {
  let service: object;

  beforeEach(() => {
    service = {};
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: TodoService, useValue: service },
      ],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('injects the todo service used by its template', () => {
    const component = TestBed.runInInjectionContext(() => new App());

    expect((component as unknown as { svc: object }).svc).toBe(service);
  });
});