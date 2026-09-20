import jwt from "jsonwebtoken";
import { USER_ROLES, type AuthUser, type UserRole } from "./types";

interface AccessTokenPayload {
  userId?: unknown;
  role?: unknown;
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function generateAccessToken(payload: AuthUser): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    getSecret(),
    {
      expiresIn: "1h",
    },
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, getSecret()) as AccessTokenPayload;

  if (
    typeof payload.userId !== "string" ||
    !payload.userId ||
    !isUserRole(payload.role)
  ) {
    throw new Error("Invalid authentication token");
  }

  return {
    userId: payload.userId,
    role: payload.role,
  };
}
