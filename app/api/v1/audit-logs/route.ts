import mongoose from "mongoose";

import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { User } from "@/models/User";
import { AUDIT_ACTIONS, type AuditAction } from "@/models/AuditLog";
import AuditLog from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivityRange = "7d" | "30d" | "90d" | "12m";

function parseRange(value: string | null): ActivityRange {
  return value === "7d" || value === "30d" || value === "90d" || value === "12m"
    ? value
    : "30d";
}

function getRangeStart(range: ActivityRange): Date {
  const start = new Date();
  start.setDate(start.getDate() - (range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365));
  return start;
}

function getDisplayName(user: { first_name?: string; last_name?: string } | null) {
  return user ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unknown user" : null;
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]);

    if (auth.error) {
      return auth.error;
    }

    await connectDatabase();

    const url = new URL(request.url);

    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);

    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || 20, 1),
      100,
    );

    const actionParam = url.searchParams.get("action");
    const range = parseRange(url.searchParams.get("range"));
    const selectedUserId = url.searchParams.get("userId");

    const filter: Record<string, unknown> = {};

    if (actionParam) {
      if (!AUDIT_ACTIONS.includes(actionParam as AuditAction)) {
        return Response.json(
          {
            success: false,
            error: {
              code: "INVALID_AUDIT_ACTION",
              message: "Invalid audit action",
            },
          },
          { status: 400 },
        );
      }

      filter.action = actionParam;
    }

    const currentUserId = new mongoose.Types.ObjectId(auth.user.userId);
    const isSuperAdmin = auth.user.role === "SUPER_ADMIN";
    let visibleUserIds: mongoose.Types.ObjectId[] = [currentUserId];

    if (auth.user.role === "MANAGER" || auth.user.role === "ADMIN") {
      const directCreationLogs = await AuditLog.find({
        action: "USER_CREATED",
        actorId: currentUserId,
      }).select("targetUserId").lean();
      const directlyCreatedIds = directCreationLogs
        .map((log) => log.targetUserId)
        .filter((id): id is mongoose.Types.ObjectId => Boolean(id));
      visibleUserIds.push(...directlyCreatedIds);

      if (auth.user.role === "ADMIN" && directlyCreatedIds.length > 0) {
        const managerIds = await User.find({
          _id: { $in: directlyCreatedIds },
          role: "MANAGER",
        }).distinct("_id");
        if (managerIds.length > 0) {
          const managerCreationLogs = await AuditLog.find({
            action: "USER_CREATED",
            actorId: { $in: managerIds },
          }).select("targetUserId").lean();
          visibleUserIds.push(
            ...managerIds,
            ...managerCreationLogs
              .map((log) => log.targetUserId)
              .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
          );
        }
      }
    }

    visibleUserIds = Array.from(
      new Map(visibleUserIds.map((id) => [id.toString(), id])).values(),
    );

    if (selectedUserId && selectedUserId !== "ALL") {
      if (!mongoose.isValidObjectId(selectedUserId)) {
        return Response.json(
          { success: false, error: { code: "INVALID_USER_ID", message: "Invalid user filter." } },
          { status: 400 },
        );
      }
      if (!isSuperAdmin && !visibleUserIds.some((id) => id.toString() === selectedUserId)) {
        return Response.json(
          { success: false, error: { code: "USER_OUT_OF_SCOPE", message: "That user is outside your activity scope." } },
          { status: 403 },
        );
      }
    }

    filter.createdAt = { $gte: getRangeStart(range), $lte: new Date() };
    if (!isSuperAdmin) {
      filter.$or = [
        { actorId: { $in: visibleUserIds } },
        { targetUserId: { $in: visibleUserIds } },
      ];
    }
    if (selectedUserId && selectedUserId !== "ALL") {
      const selectedId = new mongoose.Types.ObjectId(selectedUserId);
      filter.$and = [
        { $or: [{ actorId: selectedId }, { targetUserId: selectedId }] },
      ];
    }

    const skip = (page - 1) * limit;

    const [logs, total, visibleUsers] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "first_name last_name role")
        .populate("targetUserId", "first_name last_name role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
      User.find(isSuperAdmin ? {} : { _id: { $in: visibleUserIds } })
        .select("first_name last_name role")
        .sort({ first_name: 1, last_name: 1 })
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit);

    const events = logs.map((log) => {
      const actor = log.actorId && typeof log.actorId === "object" && "first_name" in log.actorId
        ? log.actorId as { _id: mongoose.Types.ObjectId; first_name?: string; last_name?: string; role?: string }
        : null;
      const target = log.targetUserId && typeof log.targetUserId === "object" && "first_name" in log.targetUserId
        ? log.targetUserId as { _id: mongoose.Types.ObjectId; first_name?: string; last_name?: string; role?: string }
        : null;
      return {
        id: log._id.toString(),
        action: log.action,
        createdAt: new Date(log.createdAt).toISOString(),
        actor: actor ? { id: actor._id.toString(), name: getDisplayName(actor), role: actor.role ?? log.actorRole ?? null } : null,
        target: target ? { id: target._id.toString(), name: getDisplayName(target), role: target.role ?? null } : null,
        metadata: log.metadata && typeof log.metadata.role === "string" ? { role: log.metadata.role } : null,
      };
    });

    return Response.json({
      success: true,
      data: {
        events,
        users: visibleUsers.map((user) => ({
          id: user._id.toString(),
          name: getDisplayName(user) ?? "Unknown user",
          role: user.role,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 },
    );
  }
}
