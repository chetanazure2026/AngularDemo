import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { UserProfile } from '../../core/models';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);

  /** GET /api/auth/me — the caller's identity as seen by the API. */
  getMyProfile(): Observable<UserProfile> {
    return this.api.get<UserProfile>('api/auth/me');
  }
}
