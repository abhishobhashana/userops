"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/toast";

import { authApi, getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { loginSchema } from "@/lib/validation";

type LoginField = "email" | "password";

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

export default function LoginForm() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});

  const [loading, setLoading] = useState(false);

  const isValid = email.trim().length > 0 && password.length > 0;

  function validateField(field: LoginField, value: string) {
    const result = loginSchema.shape[field].safeParse(
      field === "email" ? value.trim() : value,
    );

    setFieldErrors((current) => {
      const next = { ...current };

      if (result.success) {
        delete next[field];
      } else {
        next[field] = result.error.issues[0]?.message ?? "";
      }

      return next;
    });
  }

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setEmail(value);
    validateField("email", value);
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setPassword(value);
    validateField("password", value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const parsed = loginSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!parsed.success) {
      const errors: LoginFieldErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if ((field === "email" || field === "password") && !errors[field]) {
          errors[field] = issue.message;
        }
      }

      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await authApi.login(parsed.data);

      await refreshUser();

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const fields = getApiFieldErrors(error);

      if (fields) {
        setFieldErrors({
          email: fields.email,
          password: fields.password,
        });

        return;
      }

      toast.error(
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
          onChange={handleEmailChange}
          error={fieldErrors.email}
        />

        <AuthInput
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          error={fieldErrors.password}
        />

        <div
          data-auth-animation
          className="my-4 flex flex-col justify-between rounded-2xl bg-background-secondary"
        >
          <Link
            href="/auth/forgot-password"
            className="flex items-center justify-between rounded-t-2xl border-b border-border px-3.5 py-2.5 transition-colors focus:bg-background-tertiary"
          >
            Forgot Password
            <span className="material-symbols-rounded text-xs! text-foreground-tertiary">
              arrow_forward_ios
            </span>
          </Link>

          <Link
            href="/auth/create-account"
            className="flex items-center justify-between rounded-b-2xl px-3.5 py-2.5"
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
