import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  readonly id: number;
  readonly type: NotificationType;
  readonly message: string;
  readonly title?: string;
}

export interface NotifyOptions {
  readonly title?: string;
  /** Milliseconds before auto-dismiss; `0` keeps the notification until dismissed. */
  readonly durationMs?: number;
}

const DEFAULT_DURATION: Readonly<Record<NotificationType, number>> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: 8000,
};

/**
 * Application-wide toast notifications. State is a signal so the toast component
 * re-renders without zone.js; any service or component can push messages.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly items = signal<readonly AppNotification[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  /** Currently visible notifications, oldest first. */
  readonly notifications = this.items.asReadonly();

  success(message: string, options?: NotifyOptions): void {
    this.show('success', message, options);
  }

  error(message: string, options?: NotifyOptions): void {
    this.show('error', message, options);
  }

  warning(message: string, options?: NotifyOptions): void {
    this.show('warning', message, options);
  }

  info(message: string, options?: NotifyOptions): void {
    this.show('info', message, options);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.items.update((list) => list.filter((n) => n.id !== id));
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.items.set([]);
  }

  private show(type: NotificationType, message: string, options?: NotifyOptions): void {
    const notification: AppNotification = {
      id: this.nextId++,
      type,
      message,
      title: options?.title,
    };

    // Avoid stacking the same message repeatedly (e.g. several failing requests in a row).
    if (this.items().some((n) => n.type === type && n.message === message)) {
      return;
    }

    this.items.update((list) => [...list, notification]);

    const duration = options?.durationMs ?? DEFAULT_DURATION[type];
    if (duration > 0) {
      this.timers.set(
        notification.id,
        setTimeout(() => this.dismiss(notification.id), duration),
      );
    }
  }
}
