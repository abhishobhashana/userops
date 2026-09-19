import jwt from "jsonwebtoken";
import type { AuthUser } from "./types";

interface AccessTokenPayload extends AuthUser {
  iat?: number;
  exp?: number;
}

function getSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
  }

  return secret;
}

export function generateAccessToken(payload: AuthUser) {
  return jwt.sign(payload, getSecret(), { expiresIn: "1h" });
}

export function verifyAccessToken(token: string): AuthUser {
  const payload = jwt.verify(token, getSecret()) as AccessTokenPayload;

  if (!payload.userId || !payload.role) {
    throw new Error("Invalid authentication token");
  }

  return {
    userId: payload.userId,
    role: payload.role,
  };
}
