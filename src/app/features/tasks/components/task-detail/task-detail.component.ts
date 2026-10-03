import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';

import { APP_ROLES } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EnumLabelPipe, LoadingIndicatorComponent, PageHeaderComponent } from '../../../../shared';
import { TASK_STATUS_TRANSITIONS, TaskItem, TaskStatus } from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'app-task-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, PageHeaderComponent, LoadingIndicatorComponent, EnumLabelPipe],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
})
export class TaskDetailComponent {
  /** Route parameter, bound by `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  private readonly tasksService = inject(TasksService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly task = signal<TaskItem | null>(null);
  protected readonly loading = signal(false);
  protected readonly nextStatuses = computed<readonly TaskStatus[]>(() => {
    const t = this.task();
    return t ? TASK_STATUS_TRANSITIONS[t.status] : [];
  });
  protected readonly canDelete = computed(() => this.auth.hasRole(APP_ROLES.admin));

  constructor() {
    // Reload whenever the route id changes (e.g. navigating between tasks).
    effect(() => this.load(this.id()));
  }

  protected changeStatus(status: TaskStatus): void {
    const current = this.task();
    if (!current) {
      return;
    }
    this.tasksService
      .updateStatus(current.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        this.task.set(updated);
        this.notifications.success(`Status changed to ${status}.`);
      });
  }

  protected deleteTask(): void {
    const current = this.task();
    if (!current || !confirm(`Delete "${current.title}"? This cannot be undone.`)) {
      return;
    }
    this.tasksService
      .deleteTask(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notifications.success(`"${current.title}" deleted.`);
        void this.router.navigate(['/tasks']);
      });
  }

  private load(id: string): void {
    this.loading.set(true);
    this.tasksService
      .getTask(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (task) => {
          this.task.set(task);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          void this.router.navigate(['/tasks']);
        },
      });
  }
}
