"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ROUTE_ACCESS } from "@/lib/auth/route-access";

import Sidebar from "../ui/sidebar";
import Button from "../ui/button";
import { Modal } from "../ui/modal";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setSidebarOpen } from "@/lib/features/sidebarSlice";

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

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  const [accountOpen, setAccountOpen] = useState(false);

  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.sidebar.sidebarOpen);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        document.body.style.overflow = "";
      } else if (!sidebarOpen) {
        document.body.style.overflow = "";
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "";
    };
  }, [dispatch, sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen && window.innerWidth < 768 ? "hidden" : "";

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

  async function handleLogout() {
    setAccountOpen(false);
    dispatch(setSidebarOpen(false));

    await logout();

    router.replace("/auth/login");
  }

  const currentPage = navigation.find((item) => item.href === pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============================================================ */}
      {/* SIDEBAR                                                       */}
      {/* ============================================================ */}

      {/* {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 backdrop-blur-md bg-black/50 ease-out duration-300 data-closed:opacity-0 transition-opacity"
          aria-hidden="true"
        />
      )} */}

      <Sidebar
        data={visibleNavigation}
        onAccountClick={() => setAccountOpen(true)}
      />

      {/* ============================================================ */}
      {/* WORKSPACE                                                     */}
      {/* ============================================================ */}

      <div
        className={[
          "min-h-dvh h-full",
          "transition-[margin-left]",
          "duration-650",
          "ease-[cubic-bezier(0.22,1,0.36,1)]",
          sidebarOpen ? "ml-0 md:ml-78" : "ml-0",
        ].join(" ")}
      >
        {/* ======================================================== */}
        {/* CONTENT                                                    */}
        {/* ======================================================== */}

        <main className="p-4 pt-0 md:p-8 md:pt-0 lg:p-10 lg:pt-0">
          <Modal
            open={accountOpen}
            onClose={() => setAccountOpen(false)}
            title="Sign Out"
            description="Are you sure you want to sign out?"
          >
            <div className="flex flex-row gap-3">
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
