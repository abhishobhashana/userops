import { connectDatabase } from "@/lib/db/mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDatabase();

    return Response.json({
      success: true,
      message: "API is healthy",
    });
  } catch (error) {
    console.error("Health check error:", error);

    return Response.json(
      {
        success: false,
        message: "Database unavailable",
      },
      { status: 503 },
    );
  }
}
