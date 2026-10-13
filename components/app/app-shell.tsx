"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { useAuth } from "@/components/auth/auth-provider";
import { ROUTE_ACCESS } from "@/lib/auth/route-access";

import Sidebar from "../ui/sidebar";
import Button from "../ui/button";
import { Modal } from "../ui/modal";

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
];

const STORAGE_KEY = "userops-sidebar-open";

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

  /**
   * Restore sidebar state.
   */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved === null) {
      return;
    }

    queueMicrotask(() => {
      setSidebarOpen(saved === "true");
    });
  }, []);

  /**
   * Persist sidebar state.
   */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  /**
   * Lock mobile scrolling while sidebar is open.
   */
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

  /**
   * Filter navigation based on authenticated user's role.
   */
  const visibleNavigation = useMemo(() => {
    if (!user) {
      return [];
    }

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

    if (window.innerWidth < 768) {
      setTimeout(() => {
        setSidebarOpen(false);
      }, 200);
    }
  }

  async function handleLogout() {
    setAccountOpen(false);
    setSidebarOpen(false);

    await logout();

    router.replace("/auth/login");
  }

  const currentPage = navigation.find((item) => item.href === pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============================================================ */}
      {/* SIDEBAR                                                       */}
      {/* ============================================================ */}

      <Sidebar
        data={visibleNavigation}
        pathname={pathname}
        user={user}
        open={sidebarOpen}
        onClose={closeSidebar}
        onNavigation={handleNavigation}
        onAccountClick={() => setAccountOpen(true)}
      />

      {/* ============================================================ */}
      {/* WORKSPACE                                                     */}
      {/* ============================================================ */}

      <div
        className={[
          "min-h-screen h-full",
          "transition-[margin-left]",
          "duration-650",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarOpen ? "ml-0 md:ml-78" : "ml-0",
        ].join(" ")}
      >
        {/* ======================================================== */}
        {/* HEADER                                                     */}
        {/* ======================================================== */}

        <header className="sticky top-0 z-30 flex h-16 items-center px-4 md:px-8 lg:px-10">
          {/* Header background */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-10 h-20 w-full"
          >
            <div className="gradient-blur dark:hidden">
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>

            <div className="gradient-blur-dark hidden dark:block">
              <div />
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
          </div>

          {/* Open sidebar button */}
          <motion.div
            animate={{
              width: sidebarOpen ? 0 : 40,
            }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative z-10 shrink-0"
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
                opacity: sidebarOpen ? 0 : 1,
                scale: sidebarOpen ? 0.9 : 1,
              }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileTap={{
                scale: 1.1,
              }}
              className={[
                "liquid-glass",
                "flex h-10 w-10 shrink-0 cursor-pointer",
                "items-center justify-center",
                "rounded-full",
                "text-text",
              ].join(" ")}
            >
              <span className="material-symbols-rounded text-xl!">
                thumbnail_bar
              </span>
            </motion.button>
          </motion.div>

          {/* Page title */}
          <motion.h1
            key={`${pathname}-${sidebarOpen}`}
            variants={titleVariants}
            initial="hidden"
            animate="visible"
            transition={{
              duration: 1.5,
              delay: 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={[
              !sidebarOpen ? "ml-4" : "",
              "relative z-10 text-lg font-semibold",
            ].join(" ")}
          >
            {currentPage?.label ?? ""}
          </motion.h1>
        </header>

        {/* ======================================================== */}
        {/* CONTENT                                                    */}
        {/* ======================================================== */}

        <main className="p-4 md:p-8 lg:p-10">
          <Modal
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            title="Sign Out"
            description="Are you sure you want to sign out?"
          >
            <div className="flex flex-row gap-4">
              <Button
                variant="secondary"
                className="bg-foreground-tertiary hover:bg-foreground-tertiary"
                onClick={() => setAccountOpen(false)}
              >
                Cancel
              </Button>

              <Button onClick={handleLogout}>Sign Out</Button>
            </div>
          </Modal>

          {children}
        </main>
      </div>
    </div>
  );
}
