"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

import Icon from "./icon";

import { toggleSidebar } from "@/lib/features/sidebarSlice";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

const titleVariants = {
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  hidden: { opacity: 0, scale: 0.97, filter: "blur(4px)" },
};

export default function Header({ title, subtitle, children }: HeaderProps) {
  const sidebarOpen = useAppSelector((state) => state.sidebar.sidebarOpen);
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-30 flex items-center py-4">
      {/* Gradient blur */}
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

      {/* Sidebar toggle */}
      <motion.div
        animate={{
          width: sidebarOpen ? 0 : 50,
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative z-10 shrink-0"
      >
        <motion.button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Open sidebar"
          title="Open sidebar"
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
            "flex size-12 shrink-0 cursor-pointer",
            "items-center justify-center",
            "rounded-full",
            "text-text",
          ].join(" ")}
        >
          <Icon name="thumbnail_bar" />
        </motion.button>
      </motion.div>

      <div className="flex flex-col">
        <motion.h1
          key={`${title}-${sidebarOpen}`}
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
          {title ?? ""}
        </motion.h1>

        {subtitle ? (
          <motion.h4
            key={`${subtitle}-${sidebarOpen}`}
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
              "relative z-10 w-full whitespace-nowrap text-text-secondary font-medium",
            ].join(" ")}
          >
            {subtitle}
          </motion.h4>
        ) : null}
      </div>

      {/* Page-specific filters and actions */}
      {children && (
        <div className="relative z-30 flex w-full flex-wrap items-center justify-end gap-2.5 md:ml-auto md:w-auto">
          {children}
        </div>
      )}
    </header>
  );
}
