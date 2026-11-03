import { requireApiRole } from "@/lib/api-auth";
import { getAnalyticsData } from "@/lib/api/analytics-server";
import type { UserRole } from "@/lib/auth/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALL_ANALYTICS_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "USER",
];

export async function GET(request: Request) {
  try {
    const auth = await requireApiRole(ALL_ANALYTICS_ROLES);

    if (auth.error) {
      return auth.error;
    }

    const { userId, role } = auth.user;
    const { searchParams } = new URL(request.url);
    const data = await getAnalyticsData(userId, role, searchParams.get("range"));
    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Get analytics error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to load analytics.",
      },
      { status: 500 },
    );
  }
}
