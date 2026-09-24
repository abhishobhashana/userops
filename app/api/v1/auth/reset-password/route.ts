import { NextRequest } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/recovery";
import { createAuditLog } from "@/lib/audit";
import { connectDatabase } from "@/lib/db/mongoose";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { resetPasswordSchema } from "@/lib/validation";
import { User } from "@/models/User";
import { getRateLimitKey, rateLimit } from "@/lib/api/rate-limit";
import { rateLimitResponse } from "@/lib/api/rate-limit-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit({
      key: getRateLimitKey(request, "auth-reset-password"),
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

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

    const parsed = resetPasswordSchema.safeParse(body);

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

    const { resetToken, password } = parsed.data;

    const resetTokenHash = hashResetToken(resetToken);

    const user = await User.findOne({
      resetTokenHash,
    }).select("+resetTokenHash +resetTokenExpiresAt");

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired reset session",
          },
        },
        { status: 401 },
      );
    }

    if (
      !user.resetTokenExpiresAt ||
      user.resetTokenExpiresAt.getTime() <= Date.now()
    ) {
      user.resetTokenHash = undefined;
      user.resetTokenExpiresAt = undefined;

      await user.save();

      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Your reset session has expired",
          },
        },
        { status: 401 },
      );
    }

    if (user.status === "SUSPENDED") {
      return Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Your account has been suspended",
          },
        },
        { status: 403 },
      );
    }

    const passwordHash = await hashPassword(password);

    user.passwordHash = passwordHash;

    // The reset token is single-use.
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;

    await user.save();

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "PASSWORD_RESET",
      metadata: {
        source: "RECOVERY_CODE",
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json({
      success: true,
      message: "Password reset successfully",
      data: {
        message: "Your password has been reset successfully",
      },
    });
  } catch (error) {
    console.error("Password reset error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to reset your password",
        },
      },
      { status: 500 },
    );
  }
}
