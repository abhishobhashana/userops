import { NextRequest } from "next/server";
import { cookies } from "next/headers";

import { comparePassword } from "@/lib/auth/password";
import { generateAccessToken } from "@/lib/auth/jwt";
import { generateMfaToken } from "@/lib/auth/mfa-token";
import { toPublicUser } from "@/lib/auth/user";
import { createAuditLog } from "@/lib/audit";
import { connectDatabase } from "@/lib/db/mongoose";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { loginSchema } from "@/lib/validation/auth";
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

    const parsed = loginSchema.safeParse(body);

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

    const { email, password } = parsed.data;

    const normalizedEmail = email.toLowerCase();

    const ipAddress = getRequestIp(request);
    const userAgent = getUserAgent(request);

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!user) {
      await createAuditLog({
        action: "LOGIN_FAILED",
        metadata: {
          email: normalizedEmail,
          reason: "INVALID_CREDENTIALS",
        },
        ipAddress,
        userAgent,
      });

      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          },
        },
        { status: 401 },
      );
    }

    if (user.status === "SUSPENDED") {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: {
          reason: "ACCOUNT_SUSPENDED",
        },
        ipAddress,
        userAgent,
      });

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

    if (user.status === "INVITED") {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: {
          reason: "ACCOUNT_NOT_ACTIVATED",
        },
        ipAddress,
        userAgent,
      });

      return Response.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Your account has not been activated",
          },
        },
        { status: 403 },
      );
    }

    const passwordValid = await comparePassword(password, user.passwordHash);

    if (!passwordValid) {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: {
          reason: "INVALID_PASSWORD",
        },
        ipAddress,
        userAgent,
      });

      return Response.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          },
        },
        { status: 401 },
      );
    }

    /*
     * MFA is enabled.
     *
     * Do not issue the normal access token yet.
     * The client must complete TOTP verification first.
     */
    if (user.mfa?.enabled && user.mfa.type === "TOTP") {
      const mfaToken = generateMfaToken(user._id.toString());

      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_MFA_REQUIRED",
        metadata: {
          mfaType: "TOTP",
        },
        ipAddress,
        userAgent,
      });

      return Response.json({
        success: true,
        message: "MFA verification required",
        data: {
          requiresMfa: true,
          mfaToken,
        },
      });
    }

    /*
     * No MFA configured.
     * Complete authentication and issue the access cookie.
     */
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
      ipAddress,
      userAgent,
    });

    return Response.json({
      success: true,
      message: "Login successful",
      data: {
        requiresMfa: false,
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "SERVER_ERROR",
          message: "Unable to complete login",
        },
      },
      { status: 500 },
    );
  }
}
