import { Routes } from '@angular/router';

/** Lazy-loaded by app.routes.ts under /tasks. */
export const TASKS_ROUTES: Routes = [
  {
    path: '',
    title: 'Tasks',
    loadComponent: () => import('./components/task-list/task-list.component').then((m) => m.TaskListComponent),
  },
  {
    path: 'new',
    title: 'New task',
    loadComponent: () => import('./components/task-form/task-form.component').then((m) => m.TaskFormComponent),
  },
  {
    path: ':id',
    title: 'Task',
    loadComponent: () => import('./components/task-detail/task-detail.component').then((m) => m.TaskDetailComponent),
  },
  {
    path: ':id/edit',
    title: 'Edit task',
    loadComponent: () => import('./components/task-form/task-form.component').then((m) => m.TaskFormComponent),
  },
];
