import { connectDatabase } from "@/lib/db/mongoose";
import { getAuthUser } from "@/lib/auth/session";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authUser = await getAuthUser();

    if (!authUser) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    await connectDatabase();

    const user = await User.findById(authUser.userId);

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
