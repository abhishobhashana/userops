import { NextRequest } from "next/server";
import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { canManageRole } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import type { UserRole } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/audit";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
];

export async function GET() {
  try {
    const auth = await requireApiRole(MANAGEMENT_ROLES);
    if (auth.error) return auth.error;

    await connectDatabase();

    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN"]);
    if (auth.error) return auth.error;

    await connectDatabase();

    const body = await request.json();
    const { name, email, password, role = "USER" } = body ?? {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name ||
      !email ||
      !password
    ) {
      return Response.json(
        {
          success: false,
          message: "Name, email and password are required",
        },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const allowedRoles: UserRole[] = ["ADMIN", "MANAGER", "USER"];
    if (!allowedRoles.includes(role as UserRole)) {
      return Response.json(
        { success: false, message: "Invalid user role" },
        { status: 400 },
      );
    }

    if (!canManageRole(auth.user.role, role as UserRole)) {
      return Response.json(
        {
          success: false,
          message: "You cannot create a user with this role",
        },
        { status: 403 },
      );
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "A user with this email already exists",
        },
        { status: 409 },
      );
    }

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: role as UserRole,
      status: "ACTIVE",
    });

    await createAuditLog({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      action: "USER_CREATED",
      targetUserId: user._id.toString(),
      metadata: { role: user.role },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user error:", error);

    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
