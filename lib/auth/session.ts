import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";
import type { AuthUser, UserRole } from "./types";

export const ACCESS_TOKEN_COOKIE = "users_access_token";

export async function getAuthUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;

  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!user) {
    throw new Response(
      JSON.stringify({
        success: false,
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
  }

  return user;
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]) {
  return allowedRoles.includes(userRole);
}
