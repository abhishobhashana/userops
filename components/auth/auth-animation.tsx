"use client";

import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

interface AuthAnimationProps {
  children: ReactNode;
  className?: string;
}

export default function AuthAnimation({
  children,
  className,
}: AuthAnimationProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      gsap.set(element, {
        opacity: 1,
        y: 0,
      });

      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        {
          opacity: 0,
          y: 2,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: "power2.out",
        },
      );
    }, element);

    return () => context.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
