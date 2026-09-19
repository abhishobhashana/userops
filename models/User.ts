import mongoose, { Document, Model, Schema } from "mongoose";
import type { UserRole, UserStatus } from "@/lib/auth/types";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
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
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
