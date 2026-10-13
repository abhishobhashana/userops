"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { useAuth } from "@/components/auth/auth-provider";
import type { PublicUser, UserRole, UserStatus } from "@/lib/auth/types";
import { profileUpdateSchema } from "@/lib/validation";
import { updateMyProfile } from "@/lib/api/users";
import { getApiErrorMessage } from "@/lib/api";

import Loader from "../ui/loader";
import Button from "../ui/button";
import { Modal } from "../ui/modal";
import Textfield from "../ui/textfield";
import { useToast } from "../ui/toast";

function formatRole(role: UserRole) {
  return role
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(status: UserStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function formatLastLogin(lastLoginAt?: string | null) {
  if (!lastLoginAt) return "Never";

  const date = new Date(lastLoginAt);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase());
}

function getInitials(user: PublicUser) {
  const first = user.first_name?.charAt(0) ?? "";
  const last = user.last_name?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase() || "-";
}

interface InfoItemProps {
  label: string;
  children: React.ReactNode;
  editable?: boolean;
  onEdit?: () => void;
}

function InfoItem({
  label,
  children,
  editable = false,
  onEdit,
}: InfoItemProps) {
  const className = [
    "relative flex w-full items-center justify-between px-4 py-3 text-left",
    "after:absolute after:bottom-0 after:left-4 after:right-4 after:border-b after:border-border",
    "last:after:hidden first:rounded-t-3xl",
    editable && [
      "cursor-pointer",
      "transition-colors",
      "bg-background-secondary",
      "focus:bg-background-tertiary",
      "active:bg-background-tertiary",
    ],
  ]
    .flat()
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <p aria-label={label}>{label}</p>

      <div className="flex items-center gap-2">
        <div className="flex text-text-secondary">{children}</div>

        {editable && (
          <span
            aria-hidden="true"
            className="material-symbols-rounded text-sm! font-semibold! text-text-tertiary"
          >
            arrow_forward_ios
          </span>
        )}
      </div>
    </>
  );

  if (editable) {
    return (
      <button type="button" onClick={onEdit} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function Account({ user }: { user: PublicUser }) {
  const initials = getInitials(user);

  return (
    <div className="mx-auto flex w-full flex-col items-center justify-center">
      {user.avatar ? (
        <Image
          src={user.avatar}
          alt={`${user.first_name} ${user.last_name}`}
          width={72}
          height={72}
          className="h-18 w-18 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-background-secondary text-2xl font-semibold">
          {initials}
        </div>
      )}

      <p className="mt-2 truncate text-lg font-semibold">
        {user.first_name} {user.last_name}
      </p>

      <p className="truncate font-medium text-text-secondary">{user.email}</p>
    </div>
  );
}

type EditableProfileField = "firstName" | "lastName" | "email";

function ProfileSection({
  user,
  onEdit,
}: {
  user: PublicUser;
  onEdit: (field: EditableProfileField) => void;
}) {
  return (
    <section>
      <h4 className="mb-2 px-4 font-semibold text-text-secondary">
        Profile Information
      </h4>

      <div className="flex flex-col rounded-3xl bg-background-secondary">
        <InfoItem
          label="First Name"
          editable
          onEdit={() => onEdit("firstName")}
        >
          {user.first_name}
        </InfoItem>

        <InfoItem label="Last Name" editable onEdit={() => onEdit("lastName")}>
          {user.last_name}
        </InfoItem>

        <InfoItem label="Email" editable onEdit={() => onEdit("email")}>
          {user.email}
        </InfoItem>

        <InfoItem label="Role">{formatRole(user.role)}</InfoItem>

        <InfoItem label="Status">
          <span
            className={
              user.status === "ACTIVE"
                ? "text-green"
                : user.status === "SUSPENDED"
                  ? "text-red"
                  : user.status === "INVITED"
                    ? "text-accent"
                    : "text-foreground-tertiary"
            }
          >
            {formatStatus(user.status)}
          </span>
        </InfoItem>

        <InfoItem label="Last Login">
          {formatLastLogin(user.lastLoginAt)}
        </InfoItem>
      </div>
    </section>
  );
}

const schemaFieldMap = {
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
} as const;

function EditProfileModal({
  user,
  field,
  open,
  onClose,
  onSaved,
}: {
  user: PublicUser;
  field: EditableProfileField | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<PublicUser | null>;
}) {
  const initialValue = field
    ? {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      }[field]
    : "";

  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<EditableProfileField, string>>
  >({});

  const toast = useToast();

  // Reset the form when the selected field or its initial value changes.
  useEffect(() => {
    if (!field) return;

    setValue(initialValue);
    setError(null);
    setFieldErrors({});
  }, [field, initialValue]);

  const fieldConfig = field
    ? {
        firstName: {
          label: "First Name",
          id: "first-name",
          name: "first_name",
          type: "text",
          autoComplete: "given-name",
          placeholder: "First name",
        },
        lastName: {
          label: "Last Name",
          id: "last-name",
          name: "last_name",
          type: "text",
          autoComplete: "family-name",
          placeholder: "Last name",
        },
        email: {
          label: "Email",
          id: "email",
          name: "email",
          type: "email",
          autoComplete: "email",
          placeholder: "Email",
        },
      }[field]
    : null;

  function validateField(activeField: EditableProfileField, nextValue: string) {
    const result = profileUpdateSchema.safeParse({
      [schemaFieldMap[activeField]]: nextValue,
    });

    const message = result.success
      ? undefined
      : result.error.issues[0]?.message;

    setFieldErrors((previous) => ({
      ...previous,
      [activeField]: message,
    }));
  }

  const validation = field
    ? profileUpdateSchema.safeParse({
        [schemaFieldMap[field]]: value,
      })
    : null;

  const isValid = validation?.success === true;

  const hasChanged =
    field !== null &&
    value.trim() !==
      {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      }[field];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!field || isSaving) return;

    const result = profileUpdateSchema.safeParse({
      [schemaFieldMap[field]]: value,
    });

    if (!result.success) {
      setFieldErrors((previous) => ({
        ...previous,
        [field]:
          result.error.issues[0]?.message ??
          "Please check the value you entered.",
      }));
      return;
    }

    if (!hasChanged) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);
    setFieldErrors({});

    try {
      await updateMyProfile(result.data);

      const refreshedUser = await onSaved();

      if (!refreshedUser) {
        setError(
          "Your profile was updated, but refreshing your session failed. Please reload the page.",
        );

        toast.error("Profile updated, but refreshing your session failed.");
        return;
      }

      onClose();
      toast.success("Profile updated successfully.");
    } catch (err: unknown) {
      const message = getApiErrorMessage(
        err,
        "Unable to update your profile. Please try again.",
      );

      setError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (isSaving) return;
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={fieldConfig ? `Edit ${fieldConfig.label}` : undefined}
      description={
        fieldConfig ? `Update your ${fieldConfig.label}.` : undefined
      }
    >
      {field && fieldConfig && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <div className="grid gap-4 p-2">
            <Textfield
              id={fieldConfig.id}
              name={fieldConfig.name}
              label={fieldConfig.label}
              type={fieldConfig.type}
              autoComplete={fieldConfig.autoComplete}
              placeholder={fieldConfig.placeholder}
              value={value}
              disabled={isSaving}
              onChange={(event) => {
                const nextValue = event.target.value;

                setValue(nextValue);
                setError(null);
                validateField(field, nextValue);
              }}
              info={
                fieldConfig.name === "email"
                  ? "This will be your new UserOps Account"
                  : undefined
              }
              error={fieldErrors[field]}
            />

            {error && (
              <p role="alert" className="text-sm text-red">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-row gap-3">
            <Button
              type="button"
              variant="secondary"
              className="bg-foreground-tertiary hover:bg-foreground-tertiary"
              disabled={isSaving}
              onClick={handleClose}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSaving || !isValid || !hasChanged}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default function ProfileInformation() {
  const { user, refreshUser } = useAuth();

  const [editingField, setEditingField] = useState<EditableProfileField | null>(
    null,
  );

  const [displayField, setDisplayField] = useState<EditableProfileField | null>(
    null,
  );

  useEffect(() => {
    if (editingField !== null) return;

    const timeout = setTimeout(() => {
      setDisplayField(null);
    }, 300);

    return () => clearTimeout(timeout);
  }, [editingField]);

  function handleEdit(field: EditableProfileField) {
    setDisplayField(field);
    setEditingField(field);
  }

  function handleClose() {
    setEditingField(null);
  }

  if (!user) {
    return <Loader />;
  }

  return (
    <>
      <Account user={user} />

      <ProfileSection user={user} onEdit={handleEdit} />

      <EditProfileModal
        user={user}
        field={displayField}
        open={editingField !== null}
        onClose={handleClose}
        onSaved={refreshUser}
      />
    </>
  );
}
