import mongoose, { Document, Model, Schema } from "mongoose";
import type { UserRole, UserStatus } from "@/lib/auth/types";

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  passwordHash: string;

  recoveryCodeHash: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;

  role: UserRole;
  status: UserStatus;

  avatar?: string;
  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

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

    recoveryCodeHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },

    resetTokenHash: {
      type: String,
      select: false,
    },

    resetTokenExpiresAt: {
      type: Date,
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
  },

  {
    timestamps: true,
  },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
