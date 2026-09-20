import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status },
  );
}

export function apiError(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status },
  );
}
