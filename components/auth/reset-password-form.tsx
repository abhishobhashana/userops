"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";

import { getApiErrorMessage } from "@/lib/api";
import { api } from "@/lib/api";

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValid =
    Boolean(token) && password.length >= 12 && password === confirmPassword;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !isValid || loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/api/v1/auth/reset-password", {
        token,
        password,
      });

      setSuccess(true);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to reset your password. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <AuthHeading
          title="Invalid link"
          description="This password reset link is invalid or has expired."
        />

        <Link
          href="/auth/forgot-password"
          className="block text-center text-sm text-accent"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <AuthHeading
          title="Password updated"
          description="Your password has been successfully updated."
        />

        <Link
          href="/auth/login"
          className="block text-center text-sm text-accent"
        >
          Continue to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeading
        title="Choose a new password"
        description="Create a new password for your UserOps account."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          id="password"
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 12 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password again"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          info="Your password must contain at least 12 characters."
          error={
            confirmPassword.length > 0 && password !== confirmPassword
              ? "Passwords do not match."
              : undefined
          }
        />

        {error && (
          <p data-auth-animation className="text-sm text-red">
            {error}
          </p>
        )}

        <AuthButton type="submit" loading={loading} disabled={!isValid}>
          Update password
        </AuthButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="text-sm text-foreground-secondary">Loading…</div>
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
