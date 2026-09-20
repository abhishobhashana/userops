import jwt from "jsonwebtoken";

interface MfaTokenPayload {
  userId?: unknown;
  purpose?: unknown;
  iat?: number;
  exp?: number;
}

const MFA_TOKEN_EXPIRES_IN = "5m";

function getMfaSecret(): string {
  const secret = process.env.JWT_MFA_SECRET;

  if (!secret) {
    throw new Error("JWT_MFA_SECRET is not defined");
  }

  return secret;
}

export function generateMfaToken(userId: string): string {
  return jwt.sign(
    {
      userId,
      purpose: "MFA_CHALLENGE",
    },
    getMfaSecret(),
    {
      expiresIn: MFA_TOKEN_EXPIRES_IN,
    },
  );
}

export function verifyMfaToken(token: string): string {
  const payload = jwt.verify(token, getMfaSecret()) as MfaTokenPayload;

  if (
    typeof payload.userId !== "string" ||
    !payload.userId ||
    payload.purpose !== "MFA_CHALLENGE"
  ) {
    throw new Error("Invalid MFA token");
  }

  return payload.userId;
}
