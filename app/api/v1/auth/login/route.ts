import { connectDatabase } from "@/lib/db/mongoose";
import { comparePassword } from "@/lib/auth/password";
import { generateAccessToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/audit";
import { User } from "@/models/User";
import { getRequestIp, getUserAgent } from "@/lib/request";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "users_access_token";

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const body = await request.json();
    const { email, password } = body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      return Response.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
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
          reason: "USER_NOT_FOUND",
        },
        ipAddress,
        userAgent,
      });

      return Response.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (user.status === "SUSPENDED") {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: { reason: "ACCOUNT_SUSPENDED" },
        ipAddress,
        userAgent,
      });

      return Response.json(
        {
          success: false,
          message: "Your account has been suspended",
        },
        { status: 403 },
      );
    }

    const passwordValid = await comparePassword(
      password,
      user.passwordHash,
    );

    if (!passwordValid) {
      await createAuditLog({
        actorId: user._id.toString(),
        actorRole: user.role,
        action: "LOGIN_FAILED",
        metadata: { reason: "INVALID_PASSWORD" },
        ipAddress,
        userAgent,
      });

      return Response.json(
        { success: false, message: "Invalid email or password" },
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
      maxAge: 60 * 60,
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
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
