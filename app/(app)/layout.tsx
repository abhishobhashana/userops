import type { ReactNode } from "react";

import AppShell from "@/components/app/app-shell";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
