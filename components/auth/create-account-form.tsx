"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AuthButton from "@/components/auth/auth-button";
import AuthHeading from "@/components/auth/auth-heading";
import AuthInput from "@/components/auth/auth-input";
import AuthShell from "@/components/auth/auth-shell";
import BackButton from "@/components/ui/back-button";
import { useToast } from "@/components/ui/toast";

import { authApi, getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { createAccountSchema } from "@/lib/validation";

type CreateAccountField = "first_name" | "last_name" | "email" | "password";

type FieldErrors = {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
};

export default function CreateAccountForm() {
  const router = useRouter();
  const toast = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [recoveryCode, setRecoveryCode] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);

  const [loading, setLoading] = useState(false);

  const isValid = createAccountSchema.safeParse({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    email: email.trim(),
    password,
  }).success;

  function validateField(field: CreateAccountField, value: string) {
    const result = createAccountSchema.shape[field].safeParse(
      field === "first_name" || field === "last_name" || field === "email"
        ? value.trim()
        : value,
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

  function handleFirstNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setFirstName(value);
    validateField("first_name", value);
  }

  function handleLastNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;

    setLastName(value);
    validateField("last_name", value);
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

    const parsed = createAccountSchema.safeParse({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          (field === "first_name" ||
            field === "last_name" ||
            field === "email" ||
            field === "password") &&
          !errors[field]
        ) {
          errors[field] = issue.message;
        }
      }

      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const response = await authApi.register(parsed.data);

      setRecoveryCode(response.recoveryCode);
      setAccountCreated(true);

      toast.success("Account created successfully.");
    } catch (error) {
      const fields = getApiFieldErrors(error);

      if (fields) {
        setFieldErrors({
          first_name: fields.first_name,
          last_name: fields.last_name,
          email: fields.email,
          password: fields.password,
        });

        return;
      }

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to create your account. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  if (accountCreated) {
    function downloadRecoveryCode() {
      const content = [
        "UserOps Recovery Code",
        "",
        `Recovery Code: ${recoveryCode}`,
        "",
        "Keep this code somewhere safe.",
        "You will need it to reset your UserOps password.",
      ].join("\n");

      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "userops-recovery-code.txt";

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    }

    return (
      <AuthShell>
        <AuthHeading
          title="Save your recovery code"
          description="Keep this code somewhere safe. You will need it if you ever need to reset your password."
        />

        <div className="rounded-2xl bg-background-secondary p-5">
          <p className="mb-3 text-xs text-foreground-tertiary">Recovery Code</p>

          <p className="select-all break-all font-mono text-lg tracking-wider text-foreground">
            {recoveryCode}
          </p>
        </div>

        <p className="text-sm text-foreground-secondary">
          This code is shown only once. UserOps does not store the original
          recovery code.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <AuthButton
            type="button"
            onClick={downloadRecoveryCode}
            className="flex-1"
          >
            <span className="material-symbols-rounded text-base!">
              download
            </span>
            Download Recovery Code
          </AuthButton>

          <AuthButton
            type="button"
            onClick={() => router.replace("/auth/login")}
            className="flex-1"
          >
            Continue to Login
          </AuthButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <BackButton href="/auth/login" />

      <AuthHeading title="Create a Free UserOps Account" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <AuthInput
            id="firstName"
            name="firstName"
            label="First Name"
            autoComplete="given-name"
            placeholder="First Name"
            value={firstName}
            onChange={handleFirstNameChange}
            error={fieldErrors.first_name}
          />

          <AuthInput
            id="lastName"
            name="lastName"
            label="Last Name"
            autoComplete="family-name"
            placeholder="Last Name"
            value={lastName}
            onChange={handleLastNameChange}
            error={fieldErrors.last_name}
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
          onChange={handleEmailChange}
          info="This will be your new UserOps Account"
          error={fieldErrors.email}
        />

        <AuthInput
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          info="The password must be 8 characters and include a number, an uppercase letter, and a lowercase letter."
          error={fieldErrors.password}
        />

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
