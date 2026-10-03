import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, switchMap } from 'rxjs';

import { APP_ROLES, PagedResult, totalPages } from '../../../../core/models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { EnumLabelPipe, LoadingIndicatorComponent, PageHeaderComponent } from '../../../../shared';
import {
  DEFAULT_TASK_QUERY,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_TRANSITIONS,
  TaskListItem,
  TaskPriority,
  TaskQuery,
  TaskSortColumn,
  TaskStatus,
} from '../../models/task.model';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'app-task-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, RouterLink, PageHeaderComponent, LoadingIndicatorComponent, EnumLabelPipe],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly tasksService = inject(TasksService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly auth = inject(AuthService);

  protected readonly statuses = TASK_STATUSES;
  protected readonly priorities = TASK_PRIORITIES;
  protected readonly transitions = TASK_STATUS_TRANSITIONS;

  protected readonly query = signal<TaskQuery>(DEFAULT_TASK_QUERY);
  protected readonly result = signal<PagedResult<TaskListItem> | null>(null);
  protected readonly loading = signal(false);

  protected readonly pageCount = computed(() => (this.result() ? totalPages(this.result()!) : 0));
  /** Create/edit/status controls are always shown; the API answers 403 without a write role.
   *  Delete is destructive and admin-only, so it stays hidden for everyone else. */
  protected readonly canDelete = computed(() => this.auth.hasRole(APP_ROLES.admin));

  /** Filter bindings (two-way with the template); applied on submit. */
  protected searchText = '';
  protected status: TaskStatus | '' = '';
  protected priority: TaskPriority | '' = '';

  private readonly reload$ = new Subject<TaskQuery>();

  constructor() {
    // switchMap drops stale responses when the user changes filters quickly.
    this.reload$
      .pipe(
        switchMap((query) => {
          this.loading.set(true);
          return this.tasksService.getTasks(query);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => {
          this.result.set(result);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.load();
  }

  protected applyFilters(): void {
    this.updateQuery({
      pageNumber: 1,
      searchText: this.searchText.trim() || undefined,
      status: this.status || undefined,
      priority: this.priority || undefined,
    });
  }

  protected resetFilters(): void {
    this.searchText = '';
    this.status = '';
    this.priority = '';
    this.query.set(DEFAULT_TASK_QUERY);
    this.load();
  }

  protected sortBy(column: TaskSortColumn): void {
    const current = this.query();
    const direction = current.sortColumn === column && current.sortDirection === 'asc' ? 'desc' : 'asc';
    this.updateQuery({ sortColumn: column, sortDirection: direction, pageNumber: 1 });
  }

  protected goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.pageCount()) {
      return;
    }
    this.updateQuery({ pageNumber });
  }

  protected changePageSize(value: string): void {
    this.updateQuery({ pageSize: Number(value), pageNumber: 1 });
  }

  protected changeStatus(task: TaskListItem, value: string): void {
    const status = value as TaskStatus;
    if (status === task.status) {
      return;
    }
    this.tasksService
      .updateStatus(task.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success(`"${task.title}" moved to ${status}.`);
          this.load();
        },
        error: () => this.load(), // revert the select to the server state
      });
  }

  protected deleteTask(task: TaskListItem): void {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }
    this.tasksService
      .deleteTask(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.notifications.success(`"${task.title}" deleted.`);
        this.load();
      });
  }

  protected sortIndicator(column: TaskSortColumn): string {
    const q = this.query();
    return q.sortColumn === column ? (q.sortDirection === 'asc' ? '▲' : '▼') : '';
  }

  private updateQuery(patch: Partial<TaskQuery>): void {
    this.query.update((q) => ({ ...q, ...patch }));
    this.load();
  }

  private load(): void {
    this.reload$.next(this.query());
  }
}
