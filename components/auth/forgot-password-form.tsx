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
import { recoveryCodeSchema, resetPasswordSchema } from "@/lib/validation";

type FieldErrors = {
  recoveryCode?: string;
  password?: string;
  confirmPassword?: string;
};

export default function ForgotPasswordForm() {
  const router = useRouter();
  const toast = useToast();

  const [recoveryCode, setRecoveryCode] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [loading, setLoading] = useState(false);

  const recoveryStep = !resetToken;

  function validateRecoveryCode(value: string) {
    const result = recoveryCodeSchema.safeParse({
      recoveryCode: value.trim(),
    });

    setFieldErrors((current) => {
      const next = { ...current };

      if (result.success) {
        delete next.recoveryCode;
      } else {
        next.recoveryCode = result.error.issues[0]?.message ?? "";
      }

      return next;
    });
  }

  function validatePasswordFields(
    nextPassword: string,
    nextConfirmPassword: string,
  ) {
    const result = resetPasswordSchema.safeParse({
      resetToken,
      password: nextPassword,
      confirmPassword: nextConfirmPassword,
    });

    setFieldErrors((current) => {
      const next = { ...current };

      delete next.password;
      delete next.confirmPassword;

      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0];

          if (
            (field === "password" || field === "confirmPassword") &&
            !next[field]
          ) {
            next[field] = issue.message;
          }
        }
      }

      return next;
    });
  }

  async function handleRecoverySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const parsed = recoveryCodeSchema.safeParse({
      recoveryCode: recoveryCode.trim(),
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === "recoveryCode" && !errors.recoveryCode) {
          errors.recoveryCode = issue.message;
        }
      }

      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const response = await authApi.verifyRecoveryCode(parsed.data);

      setResetToken(response.resetToken);
      setRecoveryCode("");
      setFieldErrors({});
    } catch (error) {
      const fields = getApiFieldErrors(error);

      if (fields) {
        setFieldErrors({
          recoveryCode: fields.recoveryCode,
        });

        return;
      }

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to verify your recovery code. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    const parsed = resetPasswordSchema.safeParse({
      resetToken,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          (field === "password" || field === "confirmPassword") &&
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
      await authApi.resetPassword(parsed.data);

      toast.success("Password reset successfully.");
      router.replace("/auth/login");
    } catch (error) {
      const fields = getApiFieldErrors(error);

      if (fields) {
        setFieldErrors({
          password: fields.password,
          confirmPassword: fields.confirmPassword,
        });

        return;
      }

      toast.error(
        getApiErrorMessage(
          error,
          "Unable to reset your password. Please try again.",
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
        title={recoveryStep ? "Recover your password" : "Create a new password"}
        description={
          recoveryStep
            ? "Enter the recovery code you saved when you created your UserOps account."
            : "Choose a new password for your UserOps account."
        }
      />

      {recoveryStep ? (
        <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
          <AuthInput
            id="recoveryCode"
            name="recoveryCode"
            label="Recovery Code"
            type="text"
            autoComplete="off"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={recoveryCode}
            onChange={(event) => {
              const value = event.target.value;

              setRecoveryCode(value);
              validateRecoveryCode(value);
            }}
            error={fieldErrors.recoveryCode}
          />

          <AuthButton
            type="submit"
            loading={loading}
            disabled={!recoveryCode.trim()}
            className="mt-6"
          >
            Continue
          </AuthButton>
        </form>
      ) : (
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          <AuthInput
            id="password"
            name="password"
            label="New Password"
            type="password"
            autoComplete="new-password"
            placeholder="New Password"
            value={password}
            onChange={(event) => {
              const value = event.target.value;

              setPassword(value);
              validatePasswordFields(value, confirmPassword);
            }}
            info="The password must be 8 characters and include a number, an uppercase letter, and a lowercase letter."
            error={fieldErrors.password}
          />

          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(event) => {
              const value = event.target.value;

              setConfirmPassword(value);
              validatePasswordFields(password, value);
            }}
            error={fieldErrors.confirmPassword}
          />

          <AuthButton
            type="submit"
            loading={loading}
            disabled={password.length === 0 || confirmPassword.length === 0}
            className="mt-6"
          >
            Reset Password
          </AuthButton>
        </form>
      )}
    </AuthShell>
  );
}
