import { NextRequest } from "next/server";

import { decryptMfaSecret, encryptMfaSecret } from "@/lib/auth/mfa-crypto";
import { requireAuth } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/audit";
import { connectDatabase } from "@/lib/db/mongoose";
import { verifyTotpCode } from "@/lib/auth/totp";
import { mfaCodeSchema } from "@/lib/validation/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const authUser = await requireAuth();

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

    const parsed = mfaCodeSchema.safeParse(body);

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
            message: "Please enter a valid verification code",
            fields,
          },
        },
        { status: 422 },
      );
    }

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

    const encryptedSetupSecret = user.mfa?.setupSecretEncrypted;

    if (!encryptedSetupSecret) {
      return Response.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "MFA setup has not been started",
          },
        },
        { status: 400 },
      );
    }

    let setupSecret: string;

    try {
      setupSecret = decryptMfaSecret(encryptedSetupSecret);
    } catch (error) {
      console.error("MFA secret decryption error:", error);

      return Response.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Unable to verify MFA setup",
          },
        },
        { status: 500 },
      );
    }

    const isValid = await verifyTotpCode(setupSecret, parsed.data.code);

    if (!isValid) {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: {
          reason: "MFA_SETUP_INVALID_CODE",
          mfaType: "TOTP",
        },
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid verification code",
          },
        },
        { status: 401 },
      );
    }

    /*
     * The setup secret has now been proven.
     *
     * Promote it to the active MFA secret and
     * remove the temporary setup secret.
     */
    user.mfa = {
      enabled: true,
      type: "TOTP",
      secretEncrypted: encryptMfaSecret(setupSecret),
    };

    await user.save();

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "MFA_ENABLED",
      metadata: {
        type: "TOTP",
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return Response.json({
      success: true,
      message: "MFA enabled successfully",
      data: {
        enabled: true,
        type: "TOTP",
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("MFA enable error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to enable MFA",
        },
      },
      { status: 500 },
    );
  }
}
