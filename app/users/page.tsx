import AppPage from "@/components/app/app-page";
import AppShell from "@/components/app/app-shell";

export default function UsersPage() {
  return (
    <AppPage route="/users">
      <AppShell>
        <div>Users</div>
      </AppShell>
    </AppPage>
  );
}
