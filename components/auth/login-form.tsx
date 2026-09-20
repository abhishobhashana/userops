"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";

import { authApi, getApiErrorMessage } from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid || loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await authApi.login({
        email: email.trim(),
        password,
      });

      if (response.requiresMfa) {
        router.push("/auth/mfa");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError(
        getApiErrorMessage(error, "Unable to sign in. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <AuthHeading
        title="UserOps Account"
        description="Sign in with an email to use UserOps services."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <AuthInput
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && (
          <p data-auth-animation className="text-sm text-red">
            {error}
          </p>
        )}

        <div
          data-auth-animation
          className="flex flex-col justify-between bg-background-secondary rounded-2xl my-4"
        >
          <Link
            href="/auth/forgot-password"
            className="flex items-center justify-between transition-colors border-b border-border px-3.5 py-2.5 focus:bg-background-tertiary rounded-t-2xl"
          >
            Forgot Password
            <span className="material-symbols-rounded text-xs! text-foreground-tertiary">
              arrow_forward_ios
            </span>
          </Link>

          <Link
            href="/auth/create-account"
            className="flex items-center justify-between px-3.5 py-2.5 focus:bg-background-tertiary rounded-b-2xl"
          >
            Create a Free UserOps Account
            <span className="material-symbols-rounded text-xs! text-foreground-tertiary">
              arrow_forward_ios
            </span>
          </Link>
        </div>

        <AuthButton type="submit" loading={loading} disabled={!isValid}>
          Continue
        </AuthButton>
      </form>
    </AuthShell>
  );
}
