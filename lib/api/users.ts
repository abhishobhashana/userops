import type { PublicUser, UserRole } from "@/lib/auth/types";

import { api } from "./client";

export type { UserRole };

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export interface UserRow extends PublicUser {
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string | null;
}

type EditableProfile = Partial<
  Pick<PublicUser, "first_name" | "last_name" | "email">
>;

interface UpdateProfileResponse {
  user: PublicUser;
}

export const usersApi = {
  getUsers() {
    return api.get<UserRow[]>("/api/v1/users", {
      cache: "no-store",
    });
  },
};

export async function updateMyProfile(
  updates: EditableProfile,
): Promise<PublicUser> {
  const result = await api.patch<UpdateProfileResponse>(
    "/api/v1/users/me",
    updates,
  );

  return result.user;
}
