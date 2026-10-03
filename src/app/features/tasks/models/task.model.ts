/** Mirrors the API's TaskItemStatus / TaskPriority enums (serialized as strings). */
export const TASK_STATUSES = ['Todo', 'InProgress', 'Done', 'Cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Allowed status transitions, same table as Domain/Common/TaskStatusTransitions.cs. */
export const TASK_STATUS_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  Todo: ['InProgress', 'Cancelled'],
  InProgress: ['Todo', 'Done', 'Cancelled'],
  Done: ['InProgress'],
  Cancelled: ['Todo'],
};

/** Row of GET /api/tasks (TaskListDTO). */
export interface TaskListItem {
  readonly id: string;
  readonly title: string;
  readonly status: TaskStatus;
  readonly priority: TaskPriority;
  /** ISO date (yyyy-MM-dd) or null. */
  readonly dueDate: string | null;
  readonly assignedTo: string | null;
  readonly createdBy: string;
  /** Display name captured from the creator's token; null for rows written before names were recorded. */
  readonly createdByName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string | null;
}

/** Full task (TaskItemDto). */
export interface TaskItem extends TaskListItem {
  readonly description: string | null;
  readonly updatedBy: string | null;
  readonly updatedByName: string | null;
}

/** Body of POST /api/tasks (CreateTaskCommand). */
export interface CreateTaskRequest {
  readonly title: string;
  readonly description: string | null;
  readonly priority: TaskPriority;
  readonly dueDate: string | null;
  readonly assignedTo: string | null;
}

/** Body of PUT /api/tasks/{id} (EditTaskCommand). */
export type EditTaskRequest = CreateTaskRequest;

/** Body of PATCH /api/tasks/{id}/status. */
export interface UpdateTaskStatusRequest {
  readonly status: TaskStatus;
}

export type TaskSortColumn = 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

/** Query string of GET /api/tasks (GetTasksRequest). */
export interface TaskQuery {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly searchText?: string;
  readonly status?: TaskStatus;
  readonly priority?: TaskPriority;
  readonly assignedTo?: string;
  readonly dueDateFrom?: string;
  readonly dueDateTo?: string;
  readonly sortColumn?: TaskSortColumn;
  readonly sortDirection?: SortDirection;
}

export const DEFAULT_TASK_QUERY: TaskQuery = {
  pageNumber: 1,
  pageSize: 10,
  sortColumn: 'createdAt',
  sortDirection: 'desc',
};
