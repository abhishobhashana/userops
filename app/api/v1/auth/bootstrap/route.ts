import { connectDatabase } from "@/lib/db/mongoose";
import { hashPassword } from "@/lib/auth/password";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await connectDatabase();

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
    const { name, email, password } = body ?? {};

    if (!name || !email || !password) {
      return Response.json(
        {
          success: false,
          message: "Name, email and password are required",
        },
        { status: 400 },
      );
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return Response.json(
        { success: false, message: "Invalid request data" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 8 characters",
        },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();

    if (!normalizedName) {
      return Response.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

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

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    return Response.json(
      {
        success: true,
        message: "Super Admin created successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Bootstrap Super Admin error:", error);

    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
