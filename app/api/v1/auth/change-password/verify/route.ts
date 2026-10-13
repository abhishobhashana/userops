import { randomBytes } from "node:crypto";
import { NextRequest } from "next/server";

import { comparePassword } from "@/lib/auth/password";
import { hashRecoveryCode, hashResetToken } from "@/lib/auth/recovery";
import { getAuthUser } from "@/lib/auth/session";
import { connectDatabase } from "@/lib/db/mongoose";
import { changePasswordVerifySchema } from "@/lib/validation";
import { User } from "@/models/User";
import { getRateLimitKey, rateLimit } from "@/lib/api/rate-limit";
import { rateLimitResponse } from "@/lib/api/rate-limit-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHALLENGETTLMS = 10 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const rateLimitResult = rateLimit({
      key: getRateLimitKey(request, "auth-change-password-verify"),
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Invalid JSON request body" },
        },
        { status: 400 },
      );
    }

    const parsed = changePasswordVerifySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 422 },
      );
    }

    await connectDatabase();

    const user = await User.findById(authUser.userId).select(
      "+passwordHash +recoveryCodeHash",
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          error: { code: "USERNOTFOUND", message: "User not found" },
        },
        { status: 404 },
      );
    }

    if (user.status !== "ACTIVE") {
      return Response.json(
        {
          success: false,
          error: { code: "ACCOUNT_INACTIVE", message: "Account is not active" },
        },
        { status: 403 },
      );
    }

    const { method, credential } = parsed.data;

    const verified =
      method === "currentPassword"
        ? await comparePassword(credential, user.passwordHash)
        : hashRecoveryCode(credential) === user.recoveryCodeHash;

    if (!verified) {
      return Response.json(
        {
          success: false,
          error: {
            code: "INVALID_CREDENTIAL",
            message: "Verification failed. Check your credential.",
          },
        },
        { status: 401 },
      );
    }

    const verificationToken = randomBytes(32).toString("hex");

    user.passwordChangeTokenHash = hashResetToken(verificationToken);
    user.passwordChangeTokenExpiresAt = new Date(Date.now() + CHALLENGETTLMS);
    user.passwordChangeMethod = method;

    await user.save();

    return Response.json({
      success: true,
      message: "Identity verified",
      data: { verificationToken },
    });
  } catch (error) {
    console.error("Password change verification error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to verify your identity",
        },
      },
      { status: 500 },
    );
  }
}
