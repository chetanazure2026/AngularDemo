import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page title with an optional actions slot on the right. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    .page-header__title { margin: 0; font-size: 1.5rem; }
    .page-header__subtitle { margin: .25rem 0 0; color: var(--color-muted); }
    .page-header__actions { display: flex; gap: .5rem; }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}
