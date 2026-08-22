import mongoose from "mongoose";
import AuditLog, {
  AuditAction,
} from "../models/AuditLog.js";

interface CreateAuditLogParams {
  actorId?: string;
  actorRole?: string;

  action: AuditAction;

  targetUserId?: string;

  metadata?: Record<string, unknown>;

  ipAddress?: string;

  userAgent?: string;
}

export async function createAuditLog(
  params: CreateAuditLogParams
) {
  try {
    await AuditLog.create({
      actorId: params.actorId
        ? new mongoose.Types.ObjectId(
            params.actorId
          )
        : undefined,

      actorRole: params.actorRole,

      action: params.action,

      targetUserId: params.targetUserId
        ? new mongoose.Types.ObjectId(
            params.targetUserId
          )
        : undefined,

      metadata: params.metadata,

      ipAddress: params.ipAddress,

      userAgent: params.userAgent,
    });
  } catch (error) {
    // Audit logging should not break
    // the main user operation.
    console.error(
      "Audit log error:",
      error
    );
  }
}