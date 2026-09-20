import { connectDatabase } from "@/lib/db/mongoose";
import { getAuthUser } from "@/lib/auth/session";
import { toPublicUser } from "@/lib/auth/user";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return Response.json(
        {
          success: false,
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      );
    }

    await connectDatabase();

    const user = await User.findById(authUser.userId).select(
      "-passwordHash -mfa.secretEncrypted -mfa.setupSecretEncrypted",
    );

    if (!user) {
      return Response.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 },
      );
    }

    if (user.status !== "ACTIVE") {
      return Response.json(
        {
          success: false,
          error: {
            code: "ACCOUNT_INACTIVE",
            message: "Account is not active",
          },
        },
        { status: 403 },
      );
    }

    return Response.json({
      success: true,
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 },
    );
  }
}
