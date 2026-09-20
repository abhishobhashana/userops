import type { PublicUser } from "./types";
import type { IUser } from "@/models/User";

export function toPublicUser(
  user: IUser | Record<string, unknown>,
): PublicUser {
  const source = user as {
    _id?: unknown;
    id?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    email?: unknown;
    role?: unknown;
    status?: unknown;
    avatar?: unknown;
    lastLoginAt?: unknown;
  };

  const id =
    typeof source.id === "string" ? source.id : (source._id?.toString() ?? "");

  return {
    id,
    first_name: typeof source.first_name === "string" ? source.first_name : "",
    last_name: typeof source.last_name === "string" ? source.last_name : "",
    email: typeof source.email === "string" ? source.email : "",
    role: source.role as PublicUser["role"],
    status: source.status as PublicUser["status"],
    avatar: typeof source.avatar === "string" ? source.avatar : undefined,
    lastLoginAt:
      source.lastLoginAt instanceof Date
        ? source.lastLoginAt.toISOString()
        : typeof source.lastLoginAt === "string"
          ? source.lastLoginAt
          : null,
  };
}
