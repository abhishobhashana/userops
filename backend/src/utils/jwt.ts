import jwt from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  role: string;
}

export function generateAccessToken(
  payload: AccessTokenPayload
) {
  const secret =
    process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is not defined"
    );
  }

  return jwt.sign(
    payload,
    secret,
    {
      expiresIn: "1h",
    }
  );
}

export function verifyAccessToken(
  token: string
): AccessTokenPayload {
  const secret =
    process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is not defined"
    );
  }

  return jwt.verify(
    token,
    secret
  ) as AccessTokenPayload;
}