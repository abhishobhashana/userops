import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { connectDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const authUser = await getAuthUser();

  if (!authUser) {
    redirect("/login");
  }

  await connectDatabase();

  const [userCount, activeCount, suspendedCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ status: "SUSPENDED" }),
  ]);

  return (
    <main className="min-h-dvh p-6 lg:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <p className="mb-2 text-sm font-semibold text-accent">UserOps</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Operations overview
          </h1>
          <p className="mt-2 text-foreground-secondary">
            {authUser.role} access · live from MongoDB
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl bg-background-secondary p-6">
            <p className="text-sm text-foreground-secondary">Total users</p>
            <p className="mt-3 text-4xl font-semibold">{userCount}</p>
          </article>
          <article className="rounded-3xl bg-background-secondary p-6">
            <p className="text-sm text-foreground-secondary">Active</p>
            <p className="mt-3 text-4xl font-semibold">{activeCount}</p>
          </article>
          <article className="rounded-3xl bg-background-secondary p-6">
            <p className="text-sm text-foreground-secondary">Suspended</p>
            <p className="mt-3 text-4xl font-semibold">{suspendedCount}</p>
          </article>
        </section>

        <div className="mt-8 rounded-3xl bg-background-secondary p-6">
          <p className="font-semibold">Signed in</p>
          <p className="mt-1 text-foreground-secondary">
            Your API requests can now use the same-origin httpOnly session
            cookie.
          </p>
        </div>
      </div>
    </main>
  );
}
