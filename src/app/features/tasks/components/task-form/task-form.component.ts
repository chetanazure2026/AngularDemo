import { HttpContext } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, map } from 'rxjs';

import { SKIP_ERROR_NOTIFICATION } from '../../../../core/interceptors/error.interceptor';
import { ApiError } from '../../../../core/models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingIndicatorComponent, PageHeaderComponent } from '../../../../shared';
import { CreateTaskRequest, TASK_PRIORITIES, TaskItem, TaskPriority } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TaskFormControls {
  title: FormControl<string>;
  description: FormControl<string>;
  priority: FormControl<TaskPriority>;
  dueDate: FormControl<string>;
  assignedTo: FormControl<string>;
}

/** Create (route /tasks/new) and edit (route /tasks/:id/edit) share this component. */
@Component({
  selector: 'app-task-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, LoadingIndicatorComponent],
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent {
  /** Route parameter, bound by `withComponentInputBinding()`. Undefined when creating. */
  readonly id = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly tasksService = inject(TasksService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly priorities = TASK_PRIORITIES;
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  /** Field-level messages from the API's 400 validation response, keyed by property name. */
  protected readonly serverErrors = signal<ApiError | null>(null);

  protected readonly form = this.fb.group<TaskFormControls>({
    title: this.fb.control('', [Validators.required, Validators.maxLength(200)]),
    description: this.fb.control('', [Validators.maxLength(2000)]),
    priority: this.fb.control<TaskPriority>('Medium'),
    dueDate: this.fb.control(''),
    assignedTo: this.fb.control('', [Validators.pattern(GUID_PATTERN)]),
  });

  constructor() {
    // `id` is a signal input, so read it once the component is wired up.
    queueMicrotask(() => {
      const id = this.id();
      if (id) {
        this.loadTask(id);
      }
    });
  }

  protected submit(): void {
    this.serverErrors.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.toRequest();
    // Handle 400 here to show messages next to fields; other statuses still toast via the interceptor.
    const options = { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) };
    const id = this.id();

    this.saving.set(true);
    // Both paths resolve to the task id so the success handling is shared.
    const save$: Observable<string> = id
      ? this.tasksService.updateTask(id, request, options).pipe(map((task) => task.id))
      : this.tasksService.createTask(request, options);

    save$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (taskId) => {
        this.saving.set(false);
        this.notifications.success(id ? 'Task updated.' : 'Task created.');
        void this.router.navigate(['/tasks', taskId]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        if (error instanceof ApiError && error.status === 400) {
          this.serverErrors.set(error);
        } else if (error instanceof ApiError) {
          this.notifications.error(error.message);
        }
      },
    });
  }

  protected fieldErrors(field: keyof TaskFormControls): readonly string[] {
    const control = this.form.controls[field];
    const messages: string[] = [];

    if (control.touched && control.errors) {
      if (control.errors['required']) messages.push('This field is required.');
      if (control.errors['maxlength']) messages.push(`Maximum length is ${control.errors['maxlength'].requiredLength}.`);
      if (control.errors['pattern']) messages.push('Must be a GUID (Entra ID object id).');
    }

    return [...messages, ...(this.serverErrors()?.messagesFor(field) ?? [])];
  }

  private loadTask(id: string): void {
    this.loading.set(true);
    this.tasksService
      .getTask(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task: TaskItem) => {
          this.form.setValue({
            title: task.title,
            description: task.description ?? '',
            priority: task.priority,
            dueDate: task.dueDate ?? '',
            assignedTo: task.assignedTo ?? '',
          });
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          void this.router.navigate(['/tasks']);
        },
      });
  }

  private toRequest(): CreateTaskRequest {
    const value = this.form.getRawValue();
    return {
      title: value.title.trim(),
      description: value.description.trim() || null,
      priority: value.priority,
      dueDate: value.dueDate || null,
      assignedTo: value.assignedTo.trim() || null,
    };
  }
}
