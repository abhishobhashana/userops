import { NextRequest } from "next/server";

import { encryptMfaSecret } from "@/lib/auth/mfa-crypto";
import { requireAuth } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { generateTotpSecret, generateTotpUri } from "@/lib/auth/totp";
import { connectDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const authUser = await requireAuth();

    const user = await User.findById(authUser.userId).select(
      "+mfa.secretEncrypted +mfa.setupSecretEncrypted",
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    if (user.status !== "ACTIVE") {
      return Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Your account is not active",
          },
        },
        { status: 403 },
      );
    }

    if (user.mfa?.enabled) {
      return Response.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "MFA is already enabled",
          },
        },
        { status: 409 },
      );
    }

    const secret = generateTotpSecret();

    user.mfa = {
      enabled: false,
      type: "TOTP",
      setupSecretEncrypted: encryptMfaSecret(secret),
    };

    await user.save();

    const otpauthUri = generateTotpUri(user.email, secret);

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "MFA_SETUP_STARTED",
      metadata: {
        type: "TOTP",
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return Response.json({
      success: true,
      data: {
        type: "TOTP",
        otpauthUri,
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("MFA setup error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to start MFA setup",
        },
      },
      { status: 500 },
    );
  }
}
