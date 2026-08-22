import { UserRole } from "../middleware/role.middleware.js";

const roleRank: Record<UserRole, number> = {
  USER: 1,
  MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function canManageRole(
  actorRole: UserRole,
  targetRole: UserRole
): boolean {
  return roleRank[actorRole] > roleRank[targetRole];
}