import type { UserRole } from "./types";

const roleRank: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function canManageRole(actorRole: UserRole, targetRole: UserRole) {
  return roleRank[actorRole] > roleRank[targetRole];
}
