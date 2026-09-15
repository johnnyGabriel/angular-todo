import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Todo, Priority } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './todo-item.component.html',
  styleUrl: './todo-item.component.scss',
})
export class TodoItemComponent implements OnInit {
  @Input({ required: true }) todo!: Todo;

  private fb = inject(FormBuilder);
  protected svc = inject(TodoService);

  protected confirmDelete = signal(false);

  editForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    priority: ['medium' as Priority],
    dueDate: [''],
  });

  get isEditing() {
    return this.svc.editingId() === this.todo.id;
  }

  ngOnInit() {}

  startEdit() {
    this.editForm.setValue({
      title: this.todo.title,
      description: this.todo.description ?? '',
      priority: this.todo.priority,
      dueDate: this.todo.dueDate ?? '',
    });
    this.svc.startEdit(this.todo.id);
  }

  saveEdit() {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    const { title, description, priority, dueDate } = this.editForm.value;
    this.svc.update(this.todo.id, {
      title: title!,
      description: description?.trim() || undefined,
      priority: priority as Priority,
      dueDate: dueDate || undefined,
    });
    this.svc.stopEdit();
  }

  cancelEdit() {
    this.svc.stopEdit();
  }

  toggle() {
    this.svc.toggle(this.todo.id);
  }

  askDelete() {
    this.confirmDelete.set(true);
    setTimeout(() => this.confirmDelete.set(false), 3000);
  }

  confirmDel() {
    this.svc.remove(this.todo.id);
  }

  cancelDel() {
    this.confirmDelete.set(false);
  }

  priorityLabel(p: Priority): string {
    return { low: 'Low', medium: 'Med', high: 'High' }[p];
  }

  formatDate(d?: string): string {
    if (!d) return '';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isOverdue(d?: string): boolean {
    if (!d || this.todo.completed) return false;
    return new Date(d + 'T00:00:00') < new Date(new Date().toDateString());
  }
}
