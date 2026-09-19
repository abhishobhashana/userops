import { NextRequest } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { canManageRole } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/audit";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN"]);
    if (auth.error) return auth.error;

    await connectDatabase();

    const { id } = await params;
    const body = await request.json();
    const { status } = body ?? {};

    if (!id) {
      return Response.json(
        { success: false, message: "User ID is required" },
        { status: 400 },
      );
    }

    if (status !== "ACTIVE" && status !== "SUSPENDED") {
      return Response.json(
        {
          success: false,
          message: "Status must be ACTIVE or SUSPENDED",
        },
        { status: 400 },
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (auth.user.userId === user._id.toString()) {
      return Response.json(
        {
          success: false,
          message: "You cannot change your own status",
        },
        { status: 403 },
      );
    }

    if (user.role === "SUPER_ADMIN") {
      return Response.json(
        {
          success: false,
          message: "Super Admin status cannot be changed",
        },
        { status: 403 },
      );
    }

    if (
      !canManageRole(
        auth.user.role,
        user.role as UserRole,
      )
    ) {
      return Response.json(
        {
          success: false,
          message:
            "You cannot manage a user with an equal or higher role",
        },
        { status: 403 },
      );
    }

    if (user.status === status) {
      return Response.json(
        {
          success: false,
          message: `User is already ${status}`,
        },
        { status: 400 },
      );
    }

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    await createAuditLog({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      action:
        status === "ACTIVE"
          ? "USER_ACTIVATED"
          : "USER_SUSPENDED",
      targetUserId: user._id.toString(),
      metadata: {
        previousStatus,
        newStatus: status,
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json({
      success: true,
      message:
        status === "ACTIVE"
          ? "User activated successfully"
          : "User suspended successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
