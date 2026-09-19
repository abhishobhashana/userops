import type { NextRequest } from "next/server";

export function getRequestIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") || undefined;
}

export function jsonError(message: string, status: number) {
  return Response.json(
    { success: false, message },
    { status },
  );
}
