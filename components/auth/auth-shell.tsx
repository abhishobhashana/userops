import type { ReactNode } from "react";
import AuthAnimation from "./auth-animation";

interface AuthShellProps {
  children: ReactNode;
}

export default function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="h-full min-h-screen flex items-center justify-center p-8">
      <AuthAnimation className="m-auto w-full max-w-110">
        {children}
      </AuthAnimation>
    </main>
  );
}
