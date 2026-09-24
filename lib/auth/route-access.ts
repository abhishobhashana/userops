import type { UserRole } from "@/lib/auth/types";

export const ROUTE_ACCESS: Record<string, readonly UserRole[]> = {
  "/analytics": ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"],
  "/users": ["SUPER_ADMIN", "ADMIN", "MANAGER"],
  "/activity": ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"],
  "/settings": ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"],
};

export function getRouteRoles(
  pathname: keyof typeof ROUTE_ACCESS,
): readonly UserRole[] {
  return ROUTE_ACCESS[pathname];
}
