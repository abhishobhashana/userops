import mongoose, {
  Document,
  Schema,
} from "mongoose";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "USER_CREATED"
  | "USER_SUSPENDED"
  | "USER_ACTIVATED"
  | "ROLE_CHANGED";

export interface IAuditLog
  extends Document {
  actorId?: mongoose.Types.ObjectId;
  actorRole?: string;

  action: AuditAction;

  targetUserId?: mongoose.Types.ObjectId;

  metadata?: Record<string, unknown>;

  ipAddress?: string;

  userAgent?: string;

  createdAt: Date;
}

const auditLogSchema =
  new Schema<IAuditLog>(
    {
      actorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      actorRole: {
        type: String,
      },

      action: {
        type: String,
        required: true,
        enum: [
          "LOGIN_SUCCESS",
          "LOGIN_FAILED",
          "USER_CREATED",
          "USER_SUSPENDED",
          "USER_ACTIVATED",
          "ROLE_CHANGED",
        ],
      },

      targetUserId: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      metadata: {
        type: Schema.Types.Mixed,
      },

      ipAddress: {
        type: String,
      },

      userAgent: {
        type: String,
      },
    },
    {
      timestamps: {
        createdAt: true,
        updatedAt: false,
      },
    }
  );

auditLogSchema.index({
  createdAt: -1,
});

auditLogSchema.index({
  actorId: 1,
  createdAt: -1,
});

auditLogSchema.index({
  targetUserId: 1,
  createdAt: -1,
});

export default mongoose.model<IAuditLog>(
  "AuditLog",
  auditLogSchema
);