import { Request, Response } from "express";
import AuditLog from "../models/AuditLog.js";
import { AuditAction } from "../models/AuditLog.js";

export async function getAuditLogs(
  req: Request,
  res: Response
) {
  try {
    // -----------------------------------------
    // Pagination
    // -----------------------------------------

    const page = Math.max(
      Number(req.query.page) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    // -----------------------------------------
    // Filters
    // -----------------------------------------

    const action = req.query.action as
      | AuditAction
      | undefined;

    const userId = req.query.userId as
      | string
      | undefined;

    const filter: Record<string, unknown> = {};

    if (action) {
      const allowedActions: AuditAction[] = [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "USER_CREATED",
        "USER_SUSPENDED",
        "USER_ACTIVATED",
        "ROLE_CHANGED",
      ];

      if (!allowedActions.includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid audit action",
        });
      }

      filter.action = action;
    }

    if (userId) {
      filter.$or = [
        {
          actorId: userId,
        },
        {
          targetUserId: userId,
        },
      ];
    }

    // -----------------------------------------
    // Query
    // -----------------------------------------

    const [logs, total] =
      await Promise.all([
        AuditLog.find(filter)
          .populate(
            "actorId",
            "name email role"
          )
          .populate(
            "targetUserId",
            "name email role"
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        AuditLog.countDocuments(filter),
      ]);

    const totalPages =
      Math.ceil(total / limit);

    // -----------------------------------------
    // Response
    // -----------------------------------------

    return res.status(200).json({
      success: true,

      data: logs,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}