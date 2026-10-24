"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

import Icon from "./icon";

interface PageHeaderProps {
  title: string;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  children?: ReactNode;
}

const titleVariants = {
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
  hidden: { opacity: 0, scale: 0.97, filter: "blur(4px)" },
};

export default function PageHeader({
  title,
  sidebarOpen,
  onOpenSidebar,
  children,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30">
      {" "}
      {/* Header background */}{" "}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-10 h-20 w-full"
      >
        {" "}
        <div className="gradient-blur dark:hidden">
          {" "}
          <div /> <div /> <div /> <div /> <div /> <div />{" "}
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
      <div className="relative z-20 flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 md:px-8 lg:px-10">
        {/* Sidebar toggle */}
        <motion.div
          animate={{ width: sidebarOpen ? 0 : 40 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative z-10 shrink-0"
        >
          <motion.button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
            title="Open sidebar"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: sidebarOpen ? 0 : 1,
              scale: sidebarOpen ? 0.9 : 1,
            }}
            transition={{ duration: 0.2 }}
            whileTap={{ scale: 1.1 }}
            tabIndex={sidebarOpen ? -1 : 0}
            className="liquid-glass flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-text"
          >
            <Icon name="thumbnail_bar" />
          </motion.button>
        </motion.div>

        {/* Page title */}
        <motion.h1
          key={title}
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
          {title}
        </motion.h1>

        {/* Page-specific filters and actions */}
        {children && (
          <div className="relative z-10 flex w-full flex-wrap items-center gap-3 md:ml-auto md:w-auto">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
