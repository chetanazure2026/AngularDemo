import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserProfile } from '../../core/models';
import { LoadingIndicatorComponent, PageHeaderComponent } from '../../shared';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, LoadingIndicatorComponent],
  template: `
    <app-page-header title="My profile" subtitle="What the API sees in your access token (GET /api/auth/me).">
      <button type="button" class="btn" (click)="load()" [disabled]="loading()">Refresh</button>
    </app-page-header>

    @if (loading()) {
      <app-loading-indicator />
    } @else {
    @if (profile(); as p) {
      <div class="grid">
        <section class="card">
          <h2>Identity</h2>
          <dl>
            <dt>Name</dt><dd>{{ p.name ?? '—' }}</dd>
            <dt>Email</dt><dd>{{ p.email ?? '—' }}</dd>
            <dt>User id (oid)</dt><dd><code>{{ p.userId }}</code></dd>
            <dt>Tenant</dt><dd><code>{{ p.tenantId ?? '—' }}</code></dd>
          </dl>
        </section>

        <section class="card">
          <h2>Roles</h2>
          @if (p.roles.length) {
            <ul class="tags">@for (r of p.roles; track r) { <li class="tag">{{ r }}</li> }</ul>
          } @else {
            <p class="muted">No app roles assigned. Assign one on the API's enterprise application.</p>
          }

          <h2>Permissions</h2>
          @if (p.permissions.length) {
            <ul class="tags">@for (perm of p.permissions; track perm) { <li class="tag tag--ok">{{ perm }}</li> }</ul>
          } @else {
            <p class="muted">None.</p>
          }

          <h2>Scopes</h2>
          <ul class="tags">@for (s of p.scopes; track s) { <li class="tag">{{ s }}</li> }</ul>
        </section>
      </div>

      <section class="card">
        <h2>Claims</h2>
        <table class="table">
          <thead><tr><th>Type</th><th>Value</th></tr></thead>
          <tbody>
            @for (c of p.claims; track $index) {
              <tr><td><code>{{ c.type }}</code></td><td class="wrap">{{ c.value }}</td></tr>
            }
          </tbody>
        </table>
      </section>
    } @else {
      <p class="muted">Profile could not be loaded.</p>
    }
    }
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    h2 { font-size: 1rem; margin: 0 0 .5rem; }
    h2 + ul, h2 + p { margin-bottom: 1rem; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: .25rem 1rem; margin: 0; }
    dt { color: var(--color-muted); }
    dd { margin: 0; }
    .wrap { word-break: break-all; }
  `,
})
export class ProfileComponent {
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly loading = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.profileService
      .getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profile.set(profile);
          this.loading.set(false);
        },
        error: () => this.loading.set(false), // toast already shown by the error interceptor
      });
  }
}
