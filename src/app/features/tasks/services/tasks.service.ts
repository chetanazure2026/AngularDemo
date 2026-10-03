import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PagedResult } from '../../../core/models';
import { ApiService, RequestOptions } from '../../../core/services/api.service';
import {
  CreateTaskRequest,
  EditTaskRequest,
  TaskItem,
  TaskListItem,
  TaskQuery,
  TaskStatus,
  UpdateTaskStatusRequest,
} from '../models/task.model';

/** All task endpoints. Components call this; it never touches HttpClient directly. */
@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly api = inject(ApiService);
  private readonly basePath = 'api/tasks';

  getTasks(query: TaskQuery): Observable<PagedResult<TaskListItem>> {
    return this.api.get<PagedResult<TaskListItem>>(this.basePath, { params: { ...query } });
  }

  getTask(id: string): Observable<TaskItem> {
    return this.api.get<TaskItem>(`${this.basePath}/${id}`);
  }

  /** Resolves to the new task id. */
  createTask(request: CreateTaskRequest, options?: RequestOptions): Observable<string> {
    return this.api.post<string, CreateTaskRequest>(this.basePath, request, options);
  }

  updateTask(id: string, request: EditTaskRequest, options?: RequestOptions): Observable<TaskItem> {
    return this.api.put<TaskItem, EditTaskRequest>(`${this.basePath}/${id}`, request, options);
  }

  updateStatus(id: string, status: TaskStatus): Observable<TaskItem> {
    return this.api.patch<TaskItem, UpdateTaskStatusRequest>(`${this.basePath}/${id}/status`, { status });
  }

  deleteTask(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`);
  }
}
