"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

import Icon from "./icon";
import { useAuth } from "@/components/auth/auth-provider";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { setSidebarOpen, toggleSidebar } from "@/lib/features/sidebarSlice";

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  data: SidebarItem[];
  onAccountClick: () => void;
}

const sidebarTransition = {
  type: "spring" as const,
  stiffness: 170,
  damping: 30,
  mass: 1.15,
};

export default function Sidebar({ data, onAccountClick }: SidebarProps) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.sidebar.sidebarOpen);
  const { user } = useAuth();

  const initials =
    `${user?.first_name?.charAt(0) ?? ""}${user?.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
    "-";

  function handleNavigation() {
    if (window.innerWidth < 768) {
      dispatch(setSidebarOpen(false));
    }
  }

  return (
    <>
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
            onClick={() => dispatch(setSidebarOpen(false))}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xl md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-110%",
        }}
        transition={sidebarTransition}
        className={[
          "md-liquid-glass",
          "fixed inset-0 z-50",
          "md:left-3 md:top-3 right-auto md:bottom-3",
          "h-auto",
          "w-full md:w-76",
          "md:rounded-3xl",
          "bg-background backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center p-4.5 md:p-2 md:pl-4.5">
            <Link href="/analytics" onClick={handleNavigation}>
              <Icon
                name="manage_accounts"
                size={26}
                className="text-text-secondary"
              />
            </Link>

            <AnimatePresence>
              {sidebarOpen && (
                <motion.button
                  type="button"
                  onClick={() => dispatch(toggleSidebar())}
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
                    scale: 1.1,
                  }}
                  className="ml-auto liquid-glass size-12 flex cursor-pointer items-center justify-center rounded-3xl text-text"
                >
                  <Icon name="thumbnail_bar" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav
            aria-label="Navigation"
            className="mt-5 flex flex-col gap-1 p-4.5 pt-0"
          >
            {data.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavigation}
                  className={[
                    "flex items-center gap-2.5",
                    "rounded-xl px-3 py-1.5",
                    "font-medium",
                    "transition-colors duration-200",
                    "text-foreground-secondary",
                    active ? "bg-background-tertiary" : "",
                  ].join(" ")}
                >
                  <Icon name={item.icon} className="text-accent" />

                  <span className="text-foreground">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Account */}
          <div className="relative mt-auto p-4.5">
            <button
              type="button"
              onClick={onAccountClick}
              aria-label="Open account menu"
              className={[
                "mt-2 flex w-full cursor-pointer items-center gap-3",
                "rounded-2xl p-4",
                "text-left font-medium",
                "transition-colors",
                "bg-background-secondary",
                "active:opacity-70",
              ].join(" ")}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background-tertiary font-semibold">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {user
                    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
                    : "User"}
                </p>
                <p className="mt-0.5 truncate text-xs text-text-secondary">
                  {user?.email ?? "Account"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
