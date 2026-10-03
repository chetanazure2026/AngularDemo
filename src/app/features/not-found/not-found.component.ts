import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <a class="btn btn--primary" routerLink="/tasks">Go to tasks</a>
    </section>
  `,
  styles: `.not-found { text-align: center; padding: 4rem 1rem; }`,
})
export class NotFoundComponent {}
