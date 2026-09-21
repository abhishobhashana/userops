import { connectDatabase } from "@/lib/db/mongoose";
import { hashPassword } from "@/lib/auth/password";
import { toPublicUser } from "@/lib/auth/user";
import { createAccountSchema } from "@/lib/validation";
import { User } from "@/models/User";
import { getRateLimitKey, rateLimit } from "@/lib/api/rate-limit";
import { rateLimitResponse } from "@/lib/api/rate-limit-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rateLimitResult = rateLimit({
      key: getRateLimitKey(request, "auth-bootstrap"),
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    await connectDatabase();

    /*
     * Bootstrap is only allowed while there is no
     * SUPER_ADMIN in the database.
     */
    const existingSuperAdmin = await User.exists({
      role: "SUPER_ADMIN",
    });

    if (existingSuperAdmin) {
      return Response.json(
        {
          success: false,
          message: "Super Admin has already been initialized",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const result = createAccountSchema.safeParse(body);

    if (!result.success) {
      const fields: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (typeof field === "string" && !fields[field]) {
          fields[field] = issue.message;
        }
      }

      return Response.json(
        {
          success: false,
          message: "Please correct the highlighted fields",
          error: {
            code: "VALIDATION_ERROR",
            message: "Please correct the highlighted fields",
            fields,
          },
        },
        { status: 422 },
      );
    }

    const { first_name, last_name, email, password } = result.data;

    const normalizedFirstName = first_name.trim();

    const normalizedLastName = last_name.trim();

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return Response.json(
        {
          success: false,
          message: "A user with this email already exists",
        },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
      email: normalizedEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    return Response.json(
      {
        success: true,
        message: "Super Admin created successfully",
        data: {
          user: toPublicUser(user),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Bootstrap Super Admin error:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}
