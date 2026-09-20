"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";
import BackButton from "@/components/ui/back-button";

import { authApi, getApiErrorMessage } from "@/lib/api";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPassword(value: string) {
  return (
    value.length >= 12 &&
    value.length <= 128 &&
    /[0-9]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value)
  );
}

export default function CreateAccountForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    isValidEmail(email.trim()) &&
    isValidPassword(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid || loading) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authApi.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      });

      router.replace("/auth/login");
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to create your account. Please try again.",
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
        title="Create a Free UserOps Account"
        description="Create your account to get started with UserOps."
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AuthInput
            id="firstName"
            name="firstName"
            label="First Name"
            autoComplete="given-name"
            placeholder="First Name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />

          <AuthInput
            id="lastName"
            name="lastName"
            label="Last Name"
            autoComplete="family-name"
            placeholder="Last Name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>

        <AuthInput
          id="email"
          name="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          placeholder="Email Address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          info="This will be your new UserOps Account"
        />

        <AuthInput
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          info="The password must be 8 characters, include a number, an uppercase
          letter, and a lowercase letter."
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
    </AuthShell>
  );
}
