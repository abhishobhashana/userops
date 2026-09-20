import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { AUDIT_ACTIONS, type AuditAction } from "@/models/AuditLog";
import AuditLog from "@/models/AuditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN"]);

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
    const userId = url.searchParams.get("userId");

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

    if (userId) {
      filter.$or = [{ actorId: userId }, { targetUserId: userId }];
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "first_name last_name email role")
        .populate("targetUserId", "first_name last_name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      AuditLog.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return Response.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
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
