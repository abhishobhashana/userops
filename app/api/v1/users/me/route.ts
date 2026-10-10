import { connectDatabase } from "@/lib/db/mongoose";
import { getAuthUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";
import { profileUpdateSchema } from "@/lib/validation";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: { field: string; message: string }[],
) {
  return Response.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status },
  );
}

export async function PATCH(request: Request) {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return errorResponse(
        "AUTHENTICATION_REQUIRED",
        "Authentication required",
        401,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_JSON", "Invalid JSON request body", 400);
    }

    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        validation.error.issues[0]?.message ?? "Invalid profile data",
        400,
        validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      );
    }

    const updates = {
      ...validation.data,
      ...(validation.data.email !== undefined
        ? { email: validation.data.email.toLowerCase() }
        : {}),
    };

    await connectDatabase();

    const currentUser = await User.findById(authUser.userId)
      .select("status")
      .lean();

    if (!currentUser) {
      return errorResponse("USER_NOT_FOUND", "User not found", 404);
    }

    if (currentUser.status !== "ACTIVE") {
      return errorResponse("ACCOUNT_INACTIVE", "Account is not active", 403);
    }

    const user = await User.findByIdAndUpdate(
      authUser.userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return errorResponse("USER_NOT_FOUND", "User not found", 404);
    }

    return Response.json({
      success: true,
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return errorResponse(
        "EMAIL_ALREADY_EXISTS",
        "This email address is already in use",
        409,
      );
    }

    console.error("Update current user error:", error);

    return errorResponse("INTERNAL_SERVER_ERROR", "Internal server error", 500);
  }
}
