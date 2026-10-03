import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { NotificationsComponent } from './shared';

/** Application shell: navigation, sign-in state, toasts and the routed content. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NotificationsComponent],
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    // After a redirect sign-in Entra ID lands on redirectUri; resume where the user wanted to go.
    const returnUrl = this.auth.consumeReturnUrl();
    if (returnUrl && this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(returnUrl);
    }
  }

  protected signIn(): void {
    void this.auth.login(this.router.url);
  }

  protected signOut(): void {
    void this.auth.logout();
  }
}
