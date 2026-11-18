import type { PublicUser, UserRole } from "@/lib/auth/types";

import { api } from "./client";

export type { UserRole };

export type UserStatus = "ACTIVE" | "INVITED" | "SUSPENDED";

export interface UserRow extends PublicUser {
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string | null;
}

export interface CreatedUserResult {
  user: UserRow;
  credentials: {
    temporaryPassword: string;
    recoveryCode: string;
  };
}

export interface CreateUserInput {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
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

  createUser(input: CreateUserInput) {
    return api.post<CreatedUserResult>("/api/v1/users", input);
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
