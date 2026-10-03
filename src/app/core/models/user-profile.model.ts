/** Mirrors `UserProfileDTO` returned by GET /api/auth/me. */
export interface UserProfile {
  readonly userId: string;
  readonly email: string | null;
  readonly name: string | null;
  readonly tenantId: string | null;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly scopes: readonly string[];
  readonly claims: readonly UserClaim[];
}

export interface UserClaim {
  readonly type: string;
  readonly value: string;
}

/** Entra ID app roles defined on the API app registration; must match Domain/Enums/Roles.cs. */
export const APP_ROLES = {
  admin: 'Admin',
  contributor: 'Contributor',
  reader: 'Reader',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];
