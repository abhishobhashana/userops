import { NextRequest } from "next/server";

import {
  generateResetToken,
  hashRecoveryCode,
  hashResetToken,
  getResetTokenExpiry,
} from "@/lib/auth/recovery";
import { connectDatabase } from "@/lib/db/mongoose";
import { recoveryCodeSchema } from "@/lib/validation";
import { User } from "@/models/User";
import { getRateLimitKey, rateLimit } from "@/lib/api/rate-limit";
import { rateLimitResponse } from "@/lib/api/rate-limit-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit({
      key: getRateLimitKey(request, "auth-forgot-password"),
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

    const parsed = recoveryCodeSchema.safeParse(body);

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

    const recoveryCodeHash = hashRecoveryCode(parsed.data.recoveryCode);

    const user = await User.findOne({
      recoveryCodeHash,
    }).select("+recoveryCodeHash");

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid recovery code",
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

    const resetToken = generateResetToken();
    const resetTokenHash = hashResetToken(resetToken);
    const resetTokenExpiresAt = getResetTokenExpiry();

    user.resetTokenHash = resetTokenHash;
    user.resetTokenExpiresAt = resetTokenExpiresAt;

    await user.save();

    return Response.json({
      success: true,
      message: "Recovery code verified",
      data: {
        resetToken,
      },
    });
  } catch (error) {
    console.error("Recovery code verification error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to verify recovery code",
        },
      },
      { status: 500 },
    );
  }
}
