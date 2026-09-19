"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "Unable to sign in");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to UserOps");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="w-full max-w-md rounded-4xl bg-background-secondary p-7 shadow-sm">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-accent">UserOps</p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-foreground-secondary">
            Continue to your operations workspace.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-accent"
            />
          </label>

          {error ? (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading}>
            {loading ? <Loader size="sm" className="**:bg-white" /> : "Sign in"}
          </Button>
        </form>
      </section>
    </main>
  );
}
