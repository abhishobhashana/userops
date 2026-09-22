import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/require-user";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/analytics");
  }

  return children;
}
