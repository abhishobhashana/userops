export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "USER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = [
  "ACTIVE",
  "SUSPENDED",
  "INVITED",
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface AuthUser {
  userId: string;
  role: UserRole;
}
