import { NextRequest } from "next/server";

import { connectDatabase } from "@/lib/db/mongoose";
import { requireApiRole } from "@/lib/api-auth";
import { canManageRole } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/user";
import type { UserRole } from "@/lib/auth/types";
import { createAuditLog } from "@/lib/audit";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { createAccountSchema } from "@/lib/validation/auth";
import { User } from "@/models/User";

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

    const users = await User.find()
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
    const auth = await requireApiRole(["SUPER_ADMIN", "ADMIN"]);

    if (auth.error) {
      return auth.error;
    }

    await connectDatabase();

    const body = await request.json();

    /*
     * User creation uses the same core account
     * validation as public registration.
     */
    const result = createAccountSchema.safeParse(body);

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

    const { first_name, last_name, email, password } = result.data;

    const role = body?.role;

    if (
      typeof role !== "string" ||
      !CREATE_USER_ROLES.includes(role as UserRole)
    ) {
      return Response.json(
        {
          success: false,
          message: "Invalid user role",
        },
        { status: 400 },
      );
    }

    const requestedRole = role as UserRole;

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

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      email: normalizedEmail,
      passwordHash,
      role: requestedRole,
      status: "ACTIVE",

      mfa: {
        enabled: false,
        type: null,
      },
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
