import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { canManageRole } from "@/lib/auth/permissions";
import { toPublicUser } from "@/lib/auth/user";
import type { UserRole, UserStatus } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/audit";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MUTABLE_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN"]);

    if (auth.error) {
      return auth.error;
    }

    await connectDatabase();

    const { id } = await params;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_ID_REQUIRED",
            message: "User ID is required",
          },
        },
        { status: 400 },
      );
    }

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_USER_ID",
            message: "Invalid user ID",
          },
        },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_JSON",
            message: "Invalid request body",
          },
        },
        { status: 400 },
      );
    }

    const status =
      typeof body === "object" && body !== null && "status" in body
        ? (body as { status?: unknown }).status
        : undefined;

    if (
      typeof status !== "string" ||
      !MUTABLE_STATUSES.includes(status as UserStatus)
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "Status must be ACTIVE or SUSPENDED",
          },
        },
        { status: 400 },
      );
    }

    const requestedStatus = status as UserStatus;

    const user = await User.findById(id);

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 },
      );
    }

    if (auth.user.userId === user._id.toString()) {
      return Response.json(
        {
          success: false,
          error: {
            code: "SELF_STATUS_CHANGE_FORBIDDEN",
            message: "You cannot change your own status",
          },
        },
        { status: 403 },
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return Response.json(
        {
          success: false,
          error: {
            code: "SUPER_ADMIN_PROTECTED",
            message: "Super Admin status cannot be changed",
          },
        },
        { status: 403 },
      );
    }

    if (!canManageRole(auth.user.role, user.role as UserRole)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_MANAGEMENT_FORBIDDEN",
            message: "You cannot manage a user with an equal or higher role",
          },
        },
        { status: 403 },
      );
    }

    if (user.status === requestedStatus) {
      return Response.json(
        {
          success: false,
          error: {
            code: "STATUS_UNCHANGED",
            message: `User is already ${requestedStatus}`,
          },
        },
        { status: 400 },
      );
    }

    const previousStatus = user.status;

    user.status = requestedStatus;

    await user.save();

    await createAuditLog({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      action:
        requestedStatus === "ACTIVE" ? "USER_ACTIVATED" : "USER_SUSPENDED",
      targetUserId: user._id.toString(),
      metadata: {
        previousStatus,
        newStatus: requestedStatus,
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json({
      success: true,
      message:
        requestedStatus === "ACTIVE"
          ? "User activated successfully"
          : "User suspended successfully",
      data: {
        user: toPublicUser(user),
        previousStatus,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

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
