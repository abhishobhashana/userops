"use client";

import { useMemo, useState } from "react";

import Button from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Modal } from "@/components/ui/modal";
import Select from "@/components/ui/select";
import Textfield from "@/components/ui/textfield";
import { useToast } from "@/components/ui/toast";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import { usersApi, type UserRow } from "@/lib/api/users";
import { createManagedUserSchema } from "@/lib/validation";
import type { UserRole } from "@/lib/auth/types";

interface CreateUserModalProps {
  open: boolean;
  allowedRoles: UserRole[];
  onClose: () => void;
  onCreated: (user: UserRow) => void;
}

interface CreatedCredentials {
  user: UserRow;
  temporaryPassword: string;
  recoveryCode: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  USER: "User",
};

export default function CreateUserModal({
  open,
  allowedRoles,
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(allowedRoles[0] ?? "USER");
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(
    null,
  );

  const validation = useMemo(
    () =>
      createManagedUserSchema.safeParse({
        first_name: firstName,
        last_name: lastName,
        email,
        role,
      }),
    [firstName, lastName, email, role],
  );
  const validationErrors = useMemo(() => {
    if (validation.success) return {};
    return validation.error.issues.reduce<Record<string, string>>(
      (current, issue) => {
        const field = issue.path[0];
        if (typeof field === "string" && !current[field]) {
          current[field] = issue.message;
        }
        return current;
      },
      {},
    );
  }, [validation]);
  const canContinue =
    validation.success &&
    allowedRoles.length > 0 &&
    allowedRoles.includes(role);

  function getFieldError(field: string) {
    if (serverErrors[field]) return serverErrors[field];
    if (touched[field] || hasAttemptedSubmit) return validationErrors[field];
    return undefined;
  }

  function markTouched(field: string) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function closeModal() {
    if (isSaving) return;
    setFirstName("");
    setLastName("");
    setEmail("");
    setServerErrors({});
    setTouched({});
    setHasAttemptedSubmit(false);
    setFormError("");
    setCredentials(null);
    onClose();
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setHasAttemptedSubmit(true);

    const result = createManagedUserSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      role,
    });

    if (!result.success) {
      setTouched({
        first_name: true,
        last_name: true,
        email: true,
        role: true,
      });
      return;
    }

    setIsSaving(true);
    setServerErrors({});
    setFormError("");

    try {
      const created = await usersApi.createUser(result.data);
      setCredentials({
        user: created.user,
        temporaryPassword: created.credentials.temporaryPassword,
        recoveryCode: created.credentials.recoveryCode,
      });
      onCreated(created.user);
      toast.success("User created successfully.");
    } catch (error) {
      setServerErrors(getApiFieldErrors(error) ?? {});
      setFormError(getApiErrorMessage(error, "Unable to create this user."));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title={credentials ? "User credentials" : "Add a User"}
      description={
        credentials
          ? "Share these sign-in details with New User and recovery code cannot be viewed again after closing this window."
          : "Enter New Account details and choose the role they should have."
      }
      className="max-w-md"
    >
      {credentials ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-background-secondary p-4">
            <p className="font-semibold">
              {credentials.user.first_name} {credentials.user.last_name}
            </p>
            <p className="mt-1 text-text-secondary">{credentials.user.email}</p>
            <p className="mt-1 text-text-tertiary">
              {ROLE_LABELS[credentials.user.role]}
            </p>
          </div>

          <CredentialRow
            label="Temporary password"
            value={credentials.temporaryPassword}
            onCopy={copyValue}
          />

          <CredentialRow
            label="Recovery code"
            value={credentials.recoveryCode}
            onCopy={copyValue}
          />

          <Button onClick={closeModal} className="mt-2">
            Done
          </Button>
        </div>
      ) : allowedRoles.length === 0 ? (
        <div className="space-y-4">
          <p className="rounded-3xl bg-background-secondary p-4 text-sm text-text-secondary">
            Your role does not have permission to create User Accounts.
          </p>
          <Button type="button" variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4">
            <Textfield
              id="new-user-first-name"
              name="first_name"
              label="First name"
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              disabled={isSaving}
              error={getFieldError("first_name")}
              onBlur={() => markTouched("first_name")}
              onChange={(event) => {
                setFirstName(event.target.value);
                setServerErrors((current) => ({ ...current, first_name: "" }));
              }}
            />
            <Textfield
              id="new-user-last-name"
              name="last_name"
              label="Last name"
              autoComplete="family-name"
              placeholder="Last name"
              value={lastName}
              disabled={isSaving}
              error={getFieldError("last_name")}
              onBlur={() => markTouched("last_name")}
              onChange={(event) => {
                setLastName(event.target.value);
                setServerErrors((current) => ({ ...current, last_name: "" }));
              }}
            />
            <Textfield
              id="new-user-email"
              name="email"
              type="email"
              label="Email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              disabled={isSaving}
              error={getFieldError("email")}
              onBlur={() => markTouched("email")}
              onChange={(event) => {
                setEmail(event.target.value);
                setServerErrors((current) => ({ ...current, email: "" }));
              }}
            />
            <Select
              label="Role"
              name="role"
              value={role}
              disabled={isSaving || allowedRoles.length === 1}
              error={getFieldError("role")}
              onChange={(value) => {
                setRole(value as UserRole);
                markTouched("role");
                setServerErrors((current) => ({ ...current, role: "" }));
              }}
              options={allowedRoles.map((allowedRole) => ({
                value: allowedRole,
                label: ROLE_LABELS[allowedRole],
              }))}
              placeholder="Choose role"
            />
          </div>

          {formError && (
            <p role="alert" className="text-sm text-red">
              {formError}
            </p>
          )}

          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving}
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} disabled={!canContinue}>
              Continue
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-4 block text-foreground">{label}</p>
      <div className="w-full flex items-center justify-between gap-2 rounded-full bg-background-secondary size-11.5 px-4 py-3">
        <code className="block break-all text-sm text-text-secondary">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void onCopy(label, value)}
          className="transition text-text-tertiary hover:text-text-secondary"
        >
          <Icon name="content_copy" size={18} />
        </button>
      </div>
    </div>
  );
}
