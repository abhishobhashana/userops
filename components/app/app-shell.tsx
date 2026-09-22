"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ROUTE_ACCESS } from "@/lib/auth/route-access";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: "analytics",
  },
  {
    label: "Users",
    href: "/users",
    icon: "group",
  },
  {
    label: "Activity",
    href: "/activity",
    icon: "history",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "settings",
  },
] as const;

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const visibleNavigation = useMemo(() => {
    if (!user) {
      return [];
    }

    return navigation.filter((item) =>
      ROUTE_ACCESS[item.href].includes(user.role),
    );
  }, [user]);

  function handleNavigation() {
    setSidebarOpen(false);
    setAccountOpen(false);
  }

  async function handleLogout() {
    setAccountOpen(false);
    setSidebarOpen(false);

    await logout();

    router.replace("/auth/login");
  }

  const initials = user?.first_name?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      <div
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        className={[
          "fixed inset-0 z-40 bg-foreground/10 backdrop-blur-sm",
          "transition-opacity duration-300",
          "lg:hidden",
          sidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Sidebar */}
      <aside
        className={[
          "fixed left-3 top-3 bottom-3 z-50",
          "w-[min(18rem,calc(100vw-1.5rem))]",
          "rounded-[1.75rem]",
          "border border-border",
          "bg-background-secondary/80",
          "shadow-[0_20px_70px_rgba(0,0,0,0.08)]",
          "backdrop-blur-2xl",
          "transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)]",
        ].join(" ")}
      >
        <div className="flex h-full flex-col p-3">
          {/* Brand */}
          <div className="flex h-12 items-center px-3">
            <Link
              href="/analytics"
              onClick={handleNavigation}
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              UserOps
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-foreground-tertiary transition-colors hover:bg-background-tertiary hover:text-foreground lg:hidden"
            >
              <span className="material-symbols-rounded text-lg!">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Application navigation"
            className="mt-5 flex flex-col gap-1"
          >
            {visibleNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigation}
                  className={[
                    "group flex h-11 items-center gap-3 rounded-xl px-3",
                    "text-sm transition-colors duration-200",
                    active
                      ? "bg-background-tertiary font-medium text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "material-symbols-rounded text-[20px]!",
                      active ? "text-foreground" : "text-foreground-tertiary",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Account */}
          <div className="relative mt-auto">
            <div className="h-px bg-border" />

            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-background-tertiary"
              aria-expanded={accountOpen}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-tertiary text-xs font-medium text-foreground">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user ? `${user.first_name} ${user.last_name}` : "User"}
                </p>

                <p className="truncate text-xs text-foreground-tertiary">
                  {user?.email ?? "Account"}
                </p>
              </div>

              <span className="material-symbols-rounded text-lg! text-foreground-tertiary">
                expand_less
              </span>
            </button>

            {accountOpen && (
              <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 overflow-hidden rounded-2xl border border-border bg-background-secondary p-1.5 shadow-xl backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm text-foreground-secondary transition-colors hover:bg-background-tertiary hover:text-foreground"
                >
                  <span className="material-symbols-rounded text-lg!">
                    logout
                  </span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Workspace */}
      <div className="min-h-screen lg:pl-78">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background-secondary/80 text-foreground shadow-sm backdrop-blur-xl"
          >
            <span className="material-symbols-rounded text-xl!">menu</span>
          </button>

          <span className="ml-3 text-sm font-semibold tracking-tight text-foreground">
            UserOps
          </span>
        </header>

        <main className="min-h-screen px-4 pb-8 pt-2 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
