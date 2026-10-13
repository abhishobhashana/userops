"use client";

import { useState } from "react";

import Button from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import Textfield from "@/components/ui/textfield";
import { useToast } from "@/components/ui/toast";

import { authApi, getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { passwordSchema } from "@/lib/validation";

type VerificationMethod = "currentPassword" | "recoveryCode";
type Step = "verify" | "newPassword";

type FieldErrors = {
  currentPassword?: string;
  recoveryCode?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function Security() {
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("verify");
  const [method, setMethod] = useState<VerificationMethod>("currentPassword");

  const [currentPassword, setCurrentPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setStep("verify");
    setMethod("currentPassword");
    setCurrentPassword("");
    setRecoveryCode("");
    setVerificationToken("");
    setNewPassword("");
    setConfirmPassword("");
    setFieldErrors({});
  }

  function handleOpen() {
    resetForm();
    setOpen(true);
  }

  function handleClose() {
    if (loading) return;

    setOpen(false);
    resetForm();
  }

  async function handleContinue() {
    if (loading) return;

    const credential =
      method === "currentPassword" ? currentPassword : recoveryCode;

    if (!credential.trim()) {
      setFieldErrors({
        [method]:
          method === "currentPassword"
            ? "Enter your current password."
            : "Enter your recovery code.",
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const result = await authApi.changePasswordVerify({
        method,
        credential,
      });

      setVerificationToken(result.verificationToken);
      setStep("newPassword");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Verification failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordUpdate() {
    if (loading) return;

    const parsed = passwordSchema.safeParse(newPassword);
    const errors: FieldErrors = {};

    if (!parsed.success) {
      errors.newPassword =
        parsed.error.issues[0]?.message ?? "Enter a valid password.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (!verificationToken) {
      setStep("verify");
      setVerificationToken("");
      toast.error("Please verify your identity again.");
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await authApi.changePasswordComplete({
        verificationToken,
        password: newPassword,
        confirmPassword,
      });

      setOpen(false);
      resetForm();
      toast.success("Password updated successfully.");
    } catch (err) {
      const fields = getApiFieldErrors(err);

      if (fields) {
        const nextErrors: FieldErrors = {};

        if (fields.password) {
          nextErrors.newPassword = fields.password;
        }

        if (fields.confirmPassword) {
          nextErrors.confirmPassword = fields.confirmPassword;
        }

        if (Object.keys(nextErrors).length > 0) {
          setFieldErrors(nextErrors);
          return;
        }
      }

      toast.error(getApiErrorMessage(err, "Unable to update your password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section>
        <h4 className="mb-2 px-4 font-semibold text-text-secondary">
          Security
        </h4>

        <div className="flex flex-col rounded-3xl bg-background-secondary">
          <button
            type="button"
            onClick={handleOpen}
            className="flex w-full cursor-pointer items-center justify-between rounded-3xl px-4 py-3 text-left transition-colors active:bg-background-tertiary"
          >
            <p>Change Password</p>

            <span
              aria-hidden="true"
              className="material-symbols-rounded text-sm! font-semibold! text-text-tertiary"
            >
              arrow_forward_ios
            </span>
          </button>
        </div>
      </section>

      <Modal
        open={open}
        onClose={handleClose}
        title={step === "verify" ? "Change Password" : "Set New Password"}
        description={
          step === "verify"
            ? "Choose how you want to verify."
            : "Choose a secure password you can remember."
        }
      >
        <div className="flex flex-col gap-4 p-2">
          {step === "verify" ? (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMethod("currentPassword");
                  setFieldErrors({});
                }}
                className={`cursor-pointer rounded-3xl border-2 bg-background-secondary p-4 text-left transition-colors ${
                  method === "currentPassword"
                    ? "border-accent"
                    : "border-transparent"
                }`}
              >
                <p className="font-medium">Current Password</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Verify using your existing password.
                </p>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setMethod("recoveryCode");
                  setFieldErrors({});
                }}
                className={`cursor-pointer rounded-3xl border-2 bg-background-secondary p-4 text-left transition-colors ${
                  method === "recoveryCode"
                    ? "border-accent"
                    : "border-transparent"
                }`}
              >
                <p className="font-medium">Recovery Code</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Verify using your account recovery code.
                </p>
              </button>

              {method === "currentPassword" ? (
                <Textfield
                  id="current-password"
                  name="currentPassword"
                  label="Current Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Current Password"
                  value={currentPassword}
                  error={fieldErrors.currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setFieldErrors({});
                  }}
                />
              ) : (
                <Textfield
                  id="recovery-code"
                  name="recoveryCode"
                  label="Recovery Code"
                  type="text"
                  autoComplete="off"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={recoveryCode}
                  error={fieldErrors.recoveryCode}
                  onChange={(event) => {
                    setRecoveryCode(event.target.value);
                    setFieldErrors({});
                  }}
                />
              )}
            </>
          ) : (
            <>
              <Textfield
                id="new-password"
                name="newPassword"
                label="New Password"
                type="password"
                autoComplete="off"
                placeholder="New Password"
                value={newPassword}
                error={fieldErrors.newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setFieldErrors((previous) => ({
                    ...previous,
                    newPassword: undefined,
                  }));
                }}
              />

              <Textfield
                id="confirm-password"
                name="confirmPassword"
                label="Retype Password"
                type="password"
                autoComplete="off"
                placeholder="Retype Password"
                value={confirmPassword}
                error={fieldErrors.confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setFieldErrors((previous) => ({
                    ...previous,
                    confirmPassword: undefined,
                  }));
                }}
              />

              <p
                role="info"
                className="px-4 font-medium text-xs text-text-secondary"
              >
                The password must be 8 characters and include a number, an
                uppercase letter, and a lowercase letter.
              </p>
            </>
          )}

          <div className="mt-1.5 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={
                step === "verify"
                  ? handleClose
                  : () => {
                      setStep("verify");
                      setVerificationToken("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setFieldErrors({});
                    }
              }
            >
              {step === "verify" ? "Cancel" : "Back"}
            </Button>

            <Button
              type="button"
              loading={loading}
              disabled={loading}
              onClick={
                step === "verify" ? handleContinue : handlePasswordUpdate
              }
            >
              Continue
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
