import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  template: `
    <app-page-header title="Sign in" subtitle="Task Management uses your Microsoft Entra ID account." />

    <section class="card">
      @if (!auth.isConfigured) {
        <p class="hint">
          Entra ID is not configured yet. Set <code>auth.clientId</code>, <code>auth.tenantId</code> and
          <code>auth.apiScope</code> in <code>src/environments/environment.development.ts</code>.
        </p>
      }

      <button type="button" class="btn btn--primary" [disabled]="!auth.isConfigured" (click)="signIn()">
        Sign in with Microsoft
      </button>
    </section>
  `,
  styles: `
    .card { max-width: 32rem; padding: 1.5rem; border: 1px solid var(--color-border); border-radius: .75rem; background: var(--color-surface); }
    .hint { margin: 0 0 1rem; padding: .75rem; border-radius: .5rem; background: #fff4e5; color: #7a4a00; }
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.auth.consumeReturnUrl() ?? '/tasks');
    }
  }

  protected signIn(): void {
    void this.auth.login();
  }
}
