import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/session";

const PROTECTED_ROUTES = ["/analytics", "/users", "/activity", "/settings"];

const AUTH_ROUTES = [
  "/auth/login",
  "/auth/create-account",
  "/auth/forgot-password",
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = matchesRoute(pathname, PROTECTED_ROUTES);

  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);

  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/analytics", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/analytics/:path*",
    "/users/:path*",
    "/activity/:path*",
    "/settings/:path*",
    "/auth/login",
    "/auth/create-account",
    "/auth/forgot-password",
  ],
};
