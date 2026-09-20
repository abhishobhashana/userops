"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";
import BackButton from "@/components/ui/back-button";
import { useAuth } from "@/components/auth/auth-provider";

import { authApi, getApiErrorMessage } from "@/lib/api";

export default function MfaForm() {
  const router = useRouter();

  const { mfaToken, setMfaToken, refreshUser } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = /^\d{6}$/.test(code.trim());

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mfaToken) {
      router.replace("/auth/login");
      return;
    }

    if (!isValid || loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authApi.verifyMfa({
        mfaToken,
        code: code.trim(),
      });

      setMfaToken(null);

      await refreshUser();

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to verify the code. Please try again.",
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
        title="Verify your identity"
        description="Enter the 6-digit code from your authenticator app."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput
          id="code"
          name="code"
          label="Verification Code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
          }
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
          Verify
        </AuthButton>
      </form>
    </AuthShell>
  );
}
