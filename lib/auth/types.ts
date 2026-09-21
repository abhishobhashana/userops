export const USER_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "SUSPENDED", "INVITED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Minimal authenticated identity stored in the access token.
 *
 * Keep this intentionally small.
 * Do not store personal or sensitive user data in the JWT.
 */
export interface AuthUser {
  userId: string;
  role: UserRole;
}

/**
 * Safe user representation returned by authenticated APIs.
 *
 * Never include:
 * - passwordHash
 * - other authentication secrets
 */
export interface PublicUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  lastLoginAt?: string | null;
}
