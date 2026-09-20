import { NextRequest } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/audit";
import { connectDatabase } from "@/lib/db/mongoose";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { toPublicUser } from "@/lib/auth/user";
import { createAccountSchema } from "@/lib/validation/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid JSON request body",
          },
        },
        { status: 400 },
      );
    }

    const parsed = createAccountSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !fields[field]) {
          fields[field] = issue.message;
        }
      }

      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Please check the highlighted fields",
            fields,
          },
        },
        { status: 422 },
      );
    }

    const { first_name, last_name, email, password } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.exists({
      email: normalizedEmail,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "An account with this email already exists",
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      first_name,
      last_name,
      email: normalizedEmail,
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      mfa: {
        enabled: false,
        type: null,
      },
    });

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "USER_CREATED",
      metadata: {
        source: "PUBLIC_REGISTRATION",
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          user: toPublicUser(user),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to create your account",
        },
      },
      { status: 500 },
    );
  }
}
