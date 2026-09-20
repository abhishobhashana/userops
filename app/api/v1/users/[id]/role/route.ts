import { NextRequest } from "next/server";
import mongoose from "mongoose";

import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { canManageRole } from "@/lib/auth/permissions";
import { toPublicUser } from "@/lib/auth/user";
import { USER_ROLES, type UserRole } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/audit";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSIGNABLE_ROLES: UserRole[] = ["ADMIN", "MANAGER", "USER"];

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

    const role =
      typeof body === "object" && body !== null && "role" in body
        ? (body as { role?: unknown }).role
        : undefined;

    if (
      typeof role !== "string" ||
      !USER_ROLES.includes(role as UserRole) ||
      !ASSIGNABLE_ROLES.includes(role as UserRole)
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_ROLE",
            message: "Invalid role",
          },
        },
        { status: 400 },
      );
    }

    const requestedRole = role as UserRole;

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
            code: "SELF_ROLE_CHANGE_FORBIDDEN",
            message: "You cannot change your own role",
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
            message: "Super Admin role cannot be changed",
          },
        },
        { status: 403 },
      );
    }

    if (
      !canManageRole(auth.user.role, user.role) ||
      !canManageRole(auth.user.role, requestedRole)
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "ROLE_MANAGEMENT_FORBIDDEN",
            message: "You cannot manage or assign this role",
          },
        },
        { status: 403 },
      );
    }

    if (user.role === requestedRole) {
      return Response.json(
        {
          success: false,
          error: {
            code: "ROLE_UNCHANGED",
            message: "User already has this role",
          },
        },
        { status: 400 },
      );
    }

    const previousRole = user.role;

    user.role = requestedRole;

    await user.save();

    await createAuditLog({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      action: "ROLE_CHANGED",
      targetUserId: user._id.toString(),
      metadata: {
        previousRole,
        newRole: user.role,
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json({
      success: true,
      message: "User role updated successfully",
      data: {
        user: toPublicUser(user),
        previousRole,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

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
