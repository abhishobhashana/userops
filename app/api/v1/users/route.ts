import { NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { canManageRole } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/user";
import type { UserRole } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/audit";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { createManagedUserSchema } from "@/lib/validation";
import { User } from "@/models/User";
import { generateRecoveryCode, hashRecoveryCode } from "@/lib/auth/recovery";
import { getVisibleManagedUserIds } from "@/lib/users/ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANAGEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

const CREATE_USER_ROLES: UserRole[] = ["ADMIN", "MANAGER", "USER"];

function getValidationFields(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of issues) {
    const field = issue.path[0];

    if (typeof field === "string" && !fields[field]) {
      fields[field] = issue.message;
    }
  }

  return fields;
}

export async function GET() {
  try {
    const auth = await requireApiRole(MANAGEMENT_ROLES);

    if (auth.error) {
      return auth.error;
    }

    await connectDatabase();

    const visibleIds = await getVisibleManagedUserIds(
      auth.user.userId,
      auth.user.role,
    );

    const users = await User.find(
      visibleIds ? { _id: { $in: visibleIds } } : {},
    )
      .select("-passwordHash -mfa.secretEncrypted")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({
      success: true,
      data: users.map(toPublicUser),
    });
  } catch (error) {
    console.error("Get users error:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN", "MANAGER"]);

    if (auth.error) {
      return auth.error;
    }

    await connectDatabase();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    /*
     * User creation uses the same core account
     * validation as public registration.
     */
    const result = createManagedUserSchema.safeParse(body);

    if (!result.success) {
      const fields = getValidationFields(result.error.issues);

      return Response.json(
        {
          success: false,
          message: "Please correct the highlighted fields",
          error: {
            code: "VALIDATION_ERROR",
            message: "Please correct the highlighted fields",
            fields,
          },
        },
        { status: 422 },
      );
    }

    const { first_name, last_name, email, role: requestedRole } = result.data;

    if (!CREATE_USER_ROLES.includes(requestedRole)) {
      return Response.json({ success: false, message: "Invalid user role" }, { status: 400 });
    }

    if (!canManageRole(auth.user.role, requestedRole)) {
      return Response.json(
        {
          success: false,
          message: "You cannot create a user with this role",
        },
        { status: 403 },
      );
    }

    const normalizedFirstName = first_name.trim();

    const normalizedLastName = last_name.trim();

    const normalizedEmail = email.trim().toLowerCase();

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

    const temporaryPassword = `Uo!${randomBytes(24).toString("base64url")}9A`;
    const passwordHash = await hashPassword(temporaryPassword);
    const recoveryCode = generateRecoveryCode();
    const recoveryCodeHash = hashRecoveryCode(recoveryCode);

    const user = await User.create({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      email: normalizedEmail,
      passwordHash,
      recoveryCodeHash,
      role: requestedRole,
      status: "ACTIVE",
    });

    await createAuditLog({
      actorId: auth.user.userId,
      actorRole: auth.user.role,
      action: "USER_CREATED",
      targetUserId: user._id.toString(),
      metadata: {
        role: user.role,
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          user: toPublicUser(user),
          credentials: {
            temporaryPassword,
            recoveryCode,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user error:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
