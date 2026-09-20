import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { generateAccessToken } from "@/lib/auth/jwt";
import { decryptMfaSecret } from "@/lib/auth/mfa-crypto";
import { verifyMfaToken } from "@/lib/auth/mfa-token";
import { toPublicUser } from "@/lib/auth/user";
import { createAuditLog } from "@/lib/audit";
import { connectDatabase } from "@/lib/db/mongoose";
import { verifyTotpCode } from "@/lib/auth/totp";
import { mfaCodeSchema } from "@/lib/validation/auth";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "users_access_token";
const ACCESS_TOKEN_MAX_AGE = 60 * 60;

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

    if (
      typeof body !== "object" ||
      body === null ||
      !("mfaToken" in body) ||
      typeof body.mfaToken !== "string"
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "MFA token is required",
          },
        },
        { status: 422 },
      );
    }

    const mfaToken = body.mfaToken;

    const parsed = mfaCodeSchema.safeParse({
      code: "code" in body && typeof body.code === "string" ? body.code : "",
    });

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Enter the 6-digit verification code",
            fields: {
              code:
                parsed.error.issues[0]?.message ?? "Invalid verification code",
            },
          },
        },
        { status: 422 },
      );
    }

    let userId: string;

    try {
      userId = verifyMfaToken(mfaToken);
    } catch {
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Your MFA session has expired. Please sign in again.",
          },
        },
        { status: 401 },
      );
    }

    const user = await User.findById(userId).select("+mfa.secretEncrypted");

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication could not be completed",
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

    if (
      !user.mfa?.enabled ||
      user.mfa.type !== "TOTP" ||
      !user.mfa.secretEncrypted
    ) {
      return Response.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "MFA is not configured for this account",
          },
        },
        { status: 400 },
      );
    }

    let secret: string;

    try {
      secret = decryptMfaSecret(user.mfa.secretEncrypted);
    } catch (error) {
      console.error("MFA secret decryption error:", error);

      return Response.json(
        {
          success: false,
          error: {
            code: "SERVER_ERROR",
            message: "Unable to verify MFA",
          },
        },
        { status: 500 },
      );
    }

    const valid = await verifyTotpCode(secret, parsed.data.code);

    if (!valid) {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: {
          reason: "INVALID_MFA_CODE",
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

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    user.lastLoginAt = new Date();
    await user.save();

    const cookieStore = await cookies();

    cookieStore.set(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: "/",
    });

    await createAuditLog({
      actorId: user._id.toString(),
      actorRole: user.role,
      action: "LOGIN_SUCCESS",
      metadata: {
        mfaType: "TOTP",
      },
      ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return Response.json({
      success: true,
      message: "Login successful",
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    console.error("MFA verification error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to complete MFA verification",
        },
      },
      { status: 500 },
    );
  }
}
