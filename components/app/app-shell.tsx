"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "@/components/auth/auth-provider";
import { ROUTE_ACCESS } from "@/lib/auth/route-access";
import { Modal } from "../ui/modal";
import Button from "../ui/button";

interface AppShellProps {
  children: ReactNode;
}

const navigation = [
  {
    label: "Analytics",
    href: "/analytics",
    icon: "bar_chart",
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

const STORAGE_KEY = "userops-sidebar-open";

const sidebarTransition = {
  type: "spring" as const,
  stiffness: 170,
  damping: 30,
  mass: 1.15,
};

const titleVariants = {
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  hidden: {
    opacity: 0,
    scale: 0.97,
    filter: "blur(4px)",
  },
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Restore sidebar state */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }

    setMounted(true);
  }, []);

  /* Persist sidebar state */
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
  }, [sidebarOpen, mounted]);

  /* Lock mobile scrolling while sidebar is open */
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const visibleNavigation = useMemo(() => {
    if (!user) return [];

    return navigation.filter((item) =>
      ROUTE_ACCESS[item.href].includes(user.role),
    );
  }, [user]);

  function openSidebar() {
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
    setAccountOpen(false);
  }

  function handleNavigation() {
    setAccountOpen(false);
  }

  async function handleLogout() {
    setAccountOpen(false);
    setSidebarOpen(false);

    await logout();

    router.replace("/auth/login");
  }

  const currentPage = navigation.find((item) => item.href === pathname);

  const initials =
    `${user?.first_name?.charAt(0) ?? ""}${user?.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
    "-";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ---------------------------------------------------------------- */}
      {/* Mobile backdrop                                                 */}
      {/* ---------------------------------------------------------------- */}

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[5px] lg:hidden md:hidden"
          />
        )}
      </AnimatePresence>

      {/* ================================================================ */}
      {/* SIDEBAR                                                           */}
      {/* ================================================================ */}

      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : -330,
        }}
        transition={sidebarTransition}
        className={[
          "fixed left-3 top-3 bottom-3 z-50",
          "w-[18rem]",
          "rounded-3xl",
          "border border-border/30",
          "bg-white/5",
          "backdrop-blur-xl",
          "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_1px_rgba(255,255,255,0.5)]",
        ].join(" ")}
      >
        <div className="flex h-full flex-col p-4.5 pt-2">
          {/* ============================================================ */}
          {/* SIDEBAR HEADER                                                */}
          {/* ============================================================ */}

          <div className="flex h-12 items-center">
            <Link
              href="/analytics"
              onClick={handleNavigation}
              className="font-medium"
            >
              <span className="material-symbols-rounded text-accent">
                manage_accounts
              </span>
            </Link>

            <AnimatePresence>
              {sidebarOpen && (
                <motion.button
                  type="button"
                  onClick={closeSidebar}
                  aria-label="Close sidemenu"
                  title="Close sidemenu"
                  initial={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                  }}
                  transition={{
                    duration: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileTap={{
                    scale: 0.9,
                  }}
                  className={[
                    "ml-auto cursor-pointer",
                    "flex",
                    "items-center justify-end",
                    "text-foreground-tertiary",
                  ].join(" ")}
                >
                  <span className="material-symbols-rounded text-xl!">
                    thumbnail_bar
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ============================================================ */}
          {/* NAVIGATION                                                    */}
          {/* ============================================================ */}

          <nav aria-label="Navigation" className="mt-5 flex flex-col gap-1">
            {visibleNavigation.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigation}
                  className={[
                    "flex items-center gap-2",
                    "rounded-xl px-3 py-1.5",
                    "font-medium",
                    "transition-colors duration-200",
                    active
                      ? "bg-background-secondary text-accent!"
                      : "text-foreground-secondary",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "material-symbols-rounded",
                      "text-[24px]!",
                      active ? "text-accent" : "text-foreground-tertiary",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ============================================================ */}
          {/* ACCOUNT                                                       */}
          {/* ============================================================ */}

          <div className="relative mt-auto">
            <button
              type="button"
              onClick={() => setAccountOpen((current) => !current)}
              aria-expanded={accountOpen}
              className={[
                "mt-2 cursor-pointer flex w-full items-center gap-3",
                "rounded-xl px-3 py-3",
                "text-left font-medium",
                "transition-colors",
                "hover:bg-background-tertiary",
              ].join(" ")}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-secondary text-xs font-semibold">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {user ? `${user.first_name} ${user.last_name}` : "User"}
                </p>

                <p className="truncate text-xs text-foreground-tertiary">
                  {user?.email ?? "Account"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ================================================================ */}
      {/* WORKSPACE                                                        */}
      {/* ================================================================ */}

      <div
        className={[
          "min-h-screen",
          "transition-[margin-left]",
          "duration-650",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarOpen ? "ml-78" : "ml-0",
        ].join(" ")}
      >
        {/* ============================================================ */}
        {/* HEADER                                                        */}
        {/* ============================================================ */}

        <header className="sticky top-0 z-30 flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={{
              width: sidebarOpen ? 0 : 40,
            }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative shrink-0 overflow-hidden"
          >
            <motion.button
              type="button"
              onClick={openSidebar}
              aria-label="Open sidemenu"
              title="Open sidemenu"
              initial={{
                opacity: 0,
                scale: 0.9,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.9,
              }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={[
                "flex h-10 w-10 shrink-0 cursor-pointer",
                "items-center justify-center",
                "rounded-full",
                "border border-border",
                "bg-white/5",
                "text-foreground-secondary",
                "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_1px_rgba(255,255,255,0.5)]",
                "backdrop-blur-xl",
              ].join(" ")}
            >
              <span className="material-symbols-rounded text-xl!">
                thumbnail_bar
              </span>
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={`${pathname}-${sidebarOpen}`}
              initial={{
                opacity: 0,
                scale: 0.96,
                filter: "blur(4px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 1.5,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`${!sidebarOpen ? "ml-4" : ""} "text-lg font-semibold"`}
            >
              {currentPage?.label ?? ""}
            </motion.h1>
          </AnimatePresence>
        </header>

        {/* ============================================================ */}
        {/* CONTENT                                                       */}
        {/* ============================================================ */}

        <main className="min-h-[calc(100vh-4rem)] px-4 pb-8 pt-2 sm:px-6 lg:px-8 lg:py-8">
          <Modal
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            title="Sign Out"
            description="Are you sure you want to sign out?"
          >
            <div className="flex gap-6">
              <Button
                rounded
                className="bg-foreground-tertiary hover:bg-foreground-tertiary"
                onClick={() => setAccountOpen(false)}
              >
                Cancel
              </Button>
              <Button rounded onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </Modal>
          {children}
        </main>
      </div>
    </div>
  );
}
