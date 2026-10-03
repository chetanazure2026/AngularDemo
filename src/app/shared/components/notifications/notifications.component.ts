import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NotificationService } from '../../../core/services/notification.service';

/** Toast container; drop once in the app shell. */
@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" role="region" aria-label="Notifications">
      @for (n of notifications.notifications(); track n.id) {
        <div class="toast" [class]="'toast toast--' + n.type" role="status">
          <div class="toast__body">
            @if (n.title) {
              <strong class="toast__title">{{ n.title }}</strong>
            }
            <span class="toast__message">{{ n.message }}</span>
          </div>
          <button type="button" class="toast__close" aria-label="Dismiss" (click)="notifications.dismiss(n.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; top: 1rem; right: 1rem; display: flex; flex-direction: column; gap: .5rem; z-index: 1000; max-width: 24rem; }
    .toast { display: flex; align-items: flex-start; gap: .75rem; padding: .75rem 1rem; border-radius: .5rem; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
    .toast--success { background: #1b7f4b; }
    .toast--error { background: #b3261e; }
    .toast--warning { background: #b26a00; }
    .toast--info { background: #1f5fbf; }
    .toast__body { display: flex; flex-direction: column; gap: .125rem; white-space: pre-line; }
    .toast__title { font-size: .875rem; }
    .toast__message { font-size: .875rem; }
    .toast__close { margin-left: auto; background: none; border: 0; color: inherit; font-size: 1.25rem; line-height: 1; cursor: pointer; }
  `,
})
export class NotificationsComponent {
  protected readonly notifications = inject(NotificationService);
}
