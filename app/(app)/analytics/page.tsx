import { redirect } from "next/navigation";
import { hasAnyRole } from "@/lib/auth/authorization";
import { getRouteRoles } from "@/lib/auth/route-access";
import AppPage from "@/components/app/app-page";
import Analytics from "@/components/analytics/analytics";
import { getCurrentUser } from "@/lib/auth/require-user";
import { getAnalyticsData } from "@/lib/api/analytics-server";
import type { AnalyticsRange } from "@/lib/api/analytics";

interface AnalyticsPageProps {
  searchParams: Promise<{ range?: string }>;
}

const ranges: AnalyticsRange[] = ["7d", "30d", "90d", "12m"];

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const [{ range: requestedRange }, user] = await Promise.all([
    searchParams,
    getCurrentUser(),
  ]);
  if (!user) redirect("/login");
  if (!hasAnyRole(user.role, getRouteRoles("/analytics"))) redirect("/403");
  const range = ranges.includes(requestedRange as AnalyticsRange)
    ? (requestedRange as AnalyticsRange)
    : "30d";
  const analytics = await getAnalyticsData(user._id.toString(), user.role, range);

  return (
    <AppPage route="/analytics">
      <Analytics analytics={analytics} role={user.role} range={range} />
    </AppPage>
  );
}

