import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from './services/todo.service';
import { TodoFormComponent } from './components/todo-form/todo-form.component';
import { TodoFilterComponent } from './components/todo-filter/todo-filter.component';
import { TodoItemComponent } from './components/todo-item/todo-item.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TodoFormComponent, TodoFilterComponent, TodoItemComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected svc = inject(TodoService);
}
