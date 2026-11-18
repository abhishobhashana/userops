"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageAnimationProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

export default function PageAnimation({
  children,
  duration = 0.5,
  delay = 0,
  className,
}: PageAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
