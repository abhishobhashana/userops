"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface SidebarItem {
  label: string;
  href: string;
  icon: string;
}

interface SidebarUser {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface SidebarProps {
  data: SidebarItem[];
  pathname: string;
  user: SidebarUser | null;
  open: boolean;
  onClose: () => void;
  onNavigation: () => void;
  onAccountClick: () => void;
}

const sidebarTransition = {
  type: "spring" as const,
  stiffness: 170,
  damping: 30,
  mass: 1.15,
};

export default function Sidebar({
  data,
  pathname,
  user,
  open,
  onClose,
  onNavigation,
  onAccountClick,
}: SidebarProps) {
  const initials =
    `${user?.first_name?.charAt(0) ?? ""}${user?.last_name?.charAt(0) ?? ""}`.toUpperCase() ||
    "-";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xl md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: open ? 0 : "-110%",
        }}
        transition={sidebarTransition}
        className={[
          "liquid-glass",
          "fixed inset-0 z-50",
          "left-3 top-3 right-auto bottom-3",
          "h-auto",
          "w-[94%] md:w-76",
          "rounded-3xl",
          "backdrop-blur-xl",
        ].join(" ")}
      >
        <div className="flex h-full flex-col p-4.5 pt-2.5">
          {/* Header */}
          <div className="flex h-12 shrink-0 items-center">
            <Link
              href="/analytics"
              onClick={onNavigation}
              className="font-medium"
            >
              <span className="material-symbols-rounded text-accent text-3xl!">
                manage_accounts
              </span>
            </Link>

            <AnimatePresence>
              {open && (
                <motion.button
                  type="button"
                  onClick={onClose}
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
                  className="ml-auto liquid-glass h-10 w-10 flex cursor-pointer items-center justify-center rounded-3xl text-text"
                >
                  <span className="material-symbols-rounded text-xl!">
                    thumbnail_bar
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation" className="mt-5 flex flex-col gap-1">
            {data.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigation}
                  className={[
                    "flex items-center gap-2.5",
                    "rounded-xl px-3 py-1.5",
                    "font-medium",
                    "transition-colors duration-200",
                    "text-foreground-secondary",
                    active ? "bg-background-tertiary" : "",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "material-symbols-rounded",
                      "text-[24px]!",
                      active ? "text-accent" : "text-foreground",
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-tertiary text-xs font-semibold">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  {user ? `${user.first_name} ${user.last_name}` : "User"}
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
