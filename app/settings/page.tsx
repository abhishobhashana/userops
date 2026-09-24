import AppPage from "@/components/app/app-page";
import AppShell from "@/components/app/app-shell";

export default function SettingsPage() {
  return (
    <AppPage route="/settings">
      <AppShell>
        <div>Settings</div>
      </AppShell>
    </AppPage>
  );
}
