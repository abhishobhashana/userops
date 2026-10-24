import "server-only";

import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { toPublicUser } from "@/lib/auth/user";
import type { UserRole } from "@/lib/auth/types";
import { User } from "@/models/User";

const MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export async function getUsers() {
  const auth = await requireApiRole(MANAGEMENT_ROLES);

  if (auth.error) {
    throw new Error("You are not authorized to view users.");
  }

  await connectDatabase();

  const users = await User.find()
    .select("-passwordHash -mfa.secretEncrypted")
    .sort({ createdAt: -1 })
    .lean();

  return users.map(toPublicUser);
}
