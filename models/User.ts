import mongoose, { Document, Model, Schema } from "mongoose";
import type { UserRole, UserStatus } from "@/lib/auth/types";

export type MfaType = "TOTP";

export interface IUserMfa {
  enabled: boolean;
  type: MfaType | null;
  secretEncrypted?: string;
  setupSecretEncrypted?: string;
}

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  passwordHash: string;

  role: UserRole;
  status: UserStatus;

  avatar?: string;
  lastLoginAt?: Date;

  mfa: IUserMfa;

  createdAt: Date;
  updatedAt: Date;
}

const mfaSchema = new Schema<IUserMfa>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["TOTP"],
      default: null,
    },
    secretEncrypted: {
      type: String,
      select: false,
    },
    setupSecretEncrypted: {
      type: String,
      select: false,
    },
  },
  {
    _id: false,
  },
);

const userSchema = new Schema<IUser>(
  {
    first_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    last_name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"],
      default: "USER",
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "INVITED"],
      default: "ACTIVE",
      index: true,
    },

    avatar: {
      type: String,
      trim: true,
    },

    lastLoginAt: {
      type: Date,
    },

    mfa: {
      type: mfaSchema,
      default: () => ({
        enabled: false,
        type: null,
      }),
    },
  },

  {
    timestamps: true,
  },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
