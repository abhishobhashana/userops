import AppPage from "@/components/app/app-page";
import Activity from "@/components/activity/activity";
import { requireUser } from "@/lib/auth/require-user";

export default async function ActivityPage() {
  const user = await requireUser();

  return (
    <AppPage route="/activity">
      <Activity role={user.role} />
    </AppPage>
  );
}
