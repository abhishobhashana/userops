import { redirect } from "next/navigation";

import { hasAnyRole } from "@/lib/auth/authorization";
import { requireUser } from "@/lib/auth/require-user";
import { getRouteRoles, ROUTE_ACCESS } from "@/lib/auth/route-access";

interface AppPageProps {
  children: React.ReactNode;
  route: keyof typeof ROUTE_ACCESS;
}

export default async function AppPage({ children, route }: AppPageProps) {
  const user = await requireUser();
  const allowedRoles = getRouteRoles(route);

  if (!hasAnyRole(user.role, allowedRoles)) {
    redirect("/403");
  }

  return children;
}
