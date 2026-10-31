import AppPage from "@/components/app/app-page";
import Header from "@/components/ui/header";

export default function AnalyticsPage() {
  return (
    <AppPage route="/analytics">
      <main className="space-y-8">
        <Header title="Analytics"></Header>
        <section className="mx-auto w-full max-w-7xl space-y-8"></section>
      </main>
    </AppPage>
  );
}
