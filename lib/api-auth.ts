import { getAuthUser } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/types";

export async function requireApiRole(allowedRoles?: UserRole[]) {
  const user = await getAuthUser();

  if (!user) {
    return {
      error: Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: Response.json(
        {
          success: false,
          message: "You do not have permission to access this resource",
        },
        { status: 403 },
      ),
    };
  }

  return { user };
}
