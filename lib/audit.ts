import mongoose from "mongoose";
import AuditLog, { type AuditAction } from "@/models/AuditLog";

interface CreateAuditLogParams {
  actorId?: string;
  actorRole?: string;
  action: AuditAction;
  targetUserId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    await AuditLog.create({
      actorId: params.actorId
        ? new mongoose.Types.ObjectId(params.actorId)
        : undefined,
      actorRole: params.actorRole,
      action: params.action,
      targetUserId: params.targetUserId
        ? new mongoose.Types.ObjectId(params.targetUserId)
        : undefined,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
