import { getCurrentUser } from "@/lib/auth/require-user";
import type { UserRole } from "@/lib/auth/types";

export async function requireApiRole(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      error: Response.json(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You do not have permission to access this resource",
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    user: {
      userId: user._id.toString(),
      role: user.role,
    },
  };
}
