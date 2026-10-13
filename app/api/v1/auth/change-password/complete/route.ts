import { NextRequest } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { hashResetToken } from "@/lib/auth/recovery";
import { getAuthUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { getRateLimitKey, rateLimit } from "@/lib/api/rate-limit";
import { rateLimitResponse } from "@/lib/api/rate-limit-response";
import { connectDatabase } from "@/lib/db/mongoose";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { changePasswordCompleteSchema } from "@/lib/validation";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return Response.json(
        {
          success: false,
          error: {
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    const rateLimitResult = rateLimit({
      key: getRateLimitKey(request, "auth-change-password-complete"),
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
          error: {
            message: "Invalid JSON request body",
          },
        },
        { status: 400 },
      );
    }

    const parsed = changePasswordCompleteSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: {
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 },
      );
    }

    const { verificationToken, password } = parsed.data;

    await connectDatabase();

    const user = await User.findOneAndUpdate(
      {
        _id: authUser.userId,
        passwordChangeTokenHash: hashResetToken(verificationToken),
        passwordChangeTokenExpiresAt: {
          $gt: new Date(),
        },
        status: "ACTIVE",
      },
      {
        $unset: {
          passwordChangeTokenHash: 1,
          passwordChangeTokenExpiresAt: 1,
          passwordChangeMethod: 1,
        },
      },
      { new: true },
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            message:
              "Verification expired or invalid. Please verify your identity again.",
          },
        },
        { status: 401 },
      );
    }

    user.passwordHash = await hashPassword(password);

    await user.save();

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "PASSWORD_CHANGED",
      metadata: {
        source: "SETTINGS",
      },
      ipAddress: getRequestIp(request),
      userAgent: getUserAgent(request),
    });

    return Response.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);

    return Response.json(
      {
        success: false,
        error: {
          message: "Unable to update your password",
        },
      },
      { status: 500 },
    );
  }
}
