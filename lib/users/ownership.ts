import "server-only";

import mongoose from "mongoose";

import AuditLog from "@/models/AuditLog";
import { User } from "@/models/User";
import type { UserRole } from "@/lib/auth/types";

/** Returns null for a global view, otherwise the accounts created by this manager/admin tree. */
export async function getVisibleManagedUserIds(
  userId: string,
  role: UserRole,
): Promise<mongoose.Types.ObjectId[] | null> {
  if (role === "SUPER_ADMIN") return null;

  const actorId = new mongoose.Types.ObjectId(userId);
  const directCreationLogs = await AuditLog.find({
    action: "USER_CREATED",
    actorId,
  }).select("targetUserId").lean();

  const directIds = directCreationLogs
    .map((log) => log.targetUserId)
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

  if (role === "MANAGER") return directIds;
  if (role !== "ADMIN" || directIds.length === 0) return directIds;

  const managerIds = await User.find({
    _id: { $in: directIds },
    role: "MANAGER",
  }).distinct("_id");

  if (managerIds.length === 0) return directIds;

  const managerCreationLogs = await AuditLog.find({
    action: "USER_CREATED",
    actorId: { $in: managerIds },
  }).select("targetUserId").lean();

  const allIds = [
    ...directIds,
    ...managerIds,
    ...managerCreationLogs
      .map((log) => log.targetUserId)
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
  ];

  return Array.from(new Map(allIds.map((id) => [id.toString(), id])).values());
}
