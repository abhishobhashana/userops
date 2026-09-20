"use client";

import Link from "next/link";
import { useState } from "react";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";

import { getApiErrorMessage } from "@/lib/api";
import { api } from "@/lib/api";
import BackButton from "../ui/back-button";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const [submitted, setSubmitted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid || loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api.post("/api/v1/auth/forgot-password", {
        email: email.trim(),
      });

      setSubmitted(true);
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to process your request. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <BackButton href="/auth/login" />

      <AuthHeading
        title="Forgot password"
        description="Enter your email to reset your password."
      />

      {submitted ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-foreground-tertiary">
            If an account exists for this email address, you&apos;ll receive
            instructions to reset your password.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            id="email"
            name="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="Email Address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error && (
            <p data-auth-animation className="text-sm text-red">
              {error}
            </p>
          )}

          <AuthButton
            type="submit"
            loading={loading}
            disabled={!isValid}
            className="mt-6"
          >
            Continue
          </AuthButton>
        </form>
      )}
    </AuthShell>
  );
}
