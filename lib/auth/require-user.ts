import { connectDatabase } from "@/lib/db/mongoose";
import { getAuthUser } from "@/lib/auth/session";
import { User } from "@/models/User";
import type { IUser } from "@/models/User";

export async function getCurrentUser(): Promise<IUser | null> {
  const authUser = await getAuthUser();

  if (!authUser) {
    return null;
  }

  await connectDatabase();

  const user = await User.findById(authUser.userId);

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}
