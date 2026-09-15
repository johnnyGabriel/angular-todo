import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TodoService } from '../../services/todo.service';
import { Priority } from '../../models/todo.model';
import { form, FormField, FormRoot, maxLength, minLength, required, schema } from '@angular/forms/signals';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [CommonModule, FormRoot, FormField],
  templateUrl: './todo-form.component.html',
  styleUrl: './todo-form.component.scss',
})
export class TodoFormComponent implements OnInit {
  protected svc = inject(TodoService);

  protected expanded = signal(false);

  formData = signal({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    dueDate: '',
  });

  formTree = form(this.formData, schema(path => {
    required(path.title);
    minLength(path.title, 2);
    maxLength(path.title, 120);
  }));

  get titleField() {
    return this.formTree.title;
  }

  hasError(field: any, kind: string) {
    return field().errors()?.some((e: any) => e.kind === kind);
  }

  ngOnInit() { }

  toggle() {
    this.expanded.update(v => !v);
    if (!this.expanded()) {
      this.formData.set({ title: '', description: '', priority: 'medium', dueDate: '' });
      this.formTree().reset();
    }
  }

  submit() {
    if (this.formTree().invalid()) {
      this.formTree().markAsTouched();
      return;
    }
    const { title, description, priority, dueDate } = this.formData();
    this.svc.add(title, description, priority, dueDate);

    this.formData.set({ title: '', description: '', priority: 'medium', dueDate: '' });
    this.formTree().reset();
    this.expanded.set(false);
  }
}
