import { Request, Response } from "express";

import { User } from "../models/User.js";

import { hashPassword } from "../utils/password.js";

import {
  UserRole,
} from "../middleware/role.middleware.js";

import {
  canManageRole,
} from "../utils/permissions.js";

import {
  createAuditLog,
} from "../services/audit.service.js";

/**
 * GET /api/v1/users
 */
export async function getUsers(
  _req: Request,
  res: Response
) {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * POST /api/v1/users
 */
export async function createUser(
  req: Request,
  res: Response
) {
  try {
    // -----------------------------------------
    // 1. Get authenticated user
    // -----------------------------------------

    const authReq = req as Request & {
      user?: {
        userId: string;
        role: UserRole;
      };
    };

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // -----------------------------------------
    // 2. Get request body
    // -----------------------------------------

    const {
      name,
      email,
      password,
      role,
    } = req.body;

    // -----------------------------------------
    // 3. Validate required fields
    // -----------------------------------------

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required",
      });
    }

    // -----------------------------------------
    // 4. Validate password
    // -----------------------------------------

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters",
      });
    }

    // -----------------------------------------
    // 5. Normalize input
    // -----------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    const normalizedName =
      name.trim();

    // -----------------------------------------
    // 6. Validate name/email
    // -----------------------------------------

    if (!normalizedName) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    // -----------------------------------------
    // 7. Check duplicate email
    // -----------------------------------------

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists",
      });
    }

    // -----------------------------------------
    // 8. Validate requested role
    // -----------------------------------------

    const allowedRoles: UserRole[] = [
      "ADMIN",
      "MANAGER",
      "USER",
    ];

    const userRole =
      (role || "USER") as UserRole;

    if (
      !allowedRoles.includes(userRole)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // -----------------------------------------
    // 9. Check role hierarchy
    // -----------------------------------------

    if (
      !canManageRole(
        authReq.user.role,
        userRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot create a user with this role",
      });
    }

    // -----------------------------------------
    // 10. Hash password
    // -----------------------------------------

    const passwordHash =
      await hashPassword(password);

    // -----------------------------------------
    // 11. Create user
    // -----------------------------------------

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      role: userRole,
      status: "ACTIVE",
    });

    // -----------------------------------------
    // 12. Create audit log
    // -----------------------------------------

    await createAuditLog({
      actorId:
        authReq.user.userId,

      actorRole:
        authReq.user.role,

      action:
        "USER_CREATED",

      targetUserId:
        user._id.toString(),

      metadata: {
        role: user.role,
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent"),
    });

    // -----------------------------------------
    // 13. Safe response
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "User created successfully",

      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt:
          user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}

/**
 * PATCH /api/v1/users/:id/status
 */
export async function updateUserStatus(
  req: Request,
  res: Response
) {
  try {
    // -----------------------------------------
    // 1. Authentication
    // -----------------------------------------

    const authReq = req as Request & {
      user?: {
        userId: string;
        role: UserRole;
      };
    };

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // -----------------------------------------
    // 2. Request data
    // -----------------------------------------

    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

    // -----------------------------------------
    // 3. Validate status
    // -----------------------------------------

    if (
      status !== "ACTIVE" &&
      status !== "SUSPENDED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be ACTIVE or SUSPENDED",
      });
    }

    // -----------------------------------------
    // 4. Find target user
    // -----------------------------------------

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // -----------------------------------------
    // 5. Prevent self modification
    // -----------------------------------------

    if (
      authReq.user.userId ===
      user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change your own status",
      });
    }

    // -----------------------------------------
    // 6. Protect Super Admin
    // -----------------------------------------

    if (
      user.role === "SUPER_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Super Admin status cannot be changed",
      });
    }

    // -----------------------------------------
    // 7. Check role hierarchy
    // -----------------------------------------

    if (
      !canManageRole(
        authReq.user.role,
        user.role as UserRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot manage a user with an equal or higher role",
      });
    }

    // -----------------------------------------
    // 8. Capture previous status
    // -----------------------------------------

    const previousStatus =
      user.status;

    // -----------------------------------------
    // 9. Avoid unnecessary update
    // -----------------------------------------

    if (
      previousStatus === status
    ) {
      return res.status(400).json({
        success: false,
        message:
          `User is already ${status}`,
      });
    }

    // -----------------------------------------
    // 10. Update status
    // -----------------------------------------

    user.status = status;

    await user.save();

    // -----------------------------------------
    // 11. Audit
    // -----------------------------------------

    await createAuditLog({
      actorId:
        authReq.user.userId,

      actorRole:
        authReq.user.role,

      action:
        status === "ACTIVE"
          ? "USER_ACTIVATED"
          : "USER_SUSPENDED",

      targetUserId:
        user._id.toString(),

      metadata: {
        previousStatus,
        newStatus: status,
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent"),
    });

    // -----------------------------------------
    // 12. Response
    // -----------------------------------------

    return res.status(200).json({
      success: true,

      message:
        status === "ACTIVE"
          ? "User activated successfully"
          : "User suspended successfully",

      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        updatedAt:
          user.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}

/**
 * PATCH /api/v1/users/:id/role
 */
export async function updateUserRole(
  req: Request,
  res: Response
) {
  try {
    // -----------------------------------------
    // 1. Request data
    // -----------------------------------------

    const { id } = req.params;
    const { role } = req.body;

    // -----------------------------------------
    // 2. Validate ID
    // -----------------------------------------

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

    // -----------------------------------------
    // 3. Validate role
    // -----------------------------------------

    const allowedRoles: UserRole[] = [
      "ADMIN",
      "MANAGER",
      "USER",
    ];

    if (
      !role ||
      !allowedRoles.includes(
        role as UserRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role",
      });
    }

    // -----------------------------------------
    // 4. Authentication
    // -----------------------------------------

    const authReq = req as Request & {
      user?: {
        userId: string;
        role: UserRole;
      };
    };

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const actorRole =
      authReq.user.role;

    // -----------------------------------------
    // 5. Find target user
    // -----------------------------------------

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // -----------------------------------------
    // 6. Prevent changing own role
    // -----------------------------------------

    if (
      authReq.user.userId ===
      user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change your own role",
      });
    }

    // -----------------------------------------
    // 7. Protect Super Admin
    // -----------------------------------------

    if (
      user.role === "SUPER_ADMIN"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Super Admin role cannot be changed",
      });
    }

    // -----------------------------------------
    // 8. Check target role
    // -----------------------------------------

    if (
      !canManageRole(
        actorRole,
        user.role as UserRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot manage a user with an equal or higher role",
      });
    }

    // -----------------------------------------
    // 9. Check new role
    // -----------------------------------------

    if (
      !canManageRole(
        actorRole,
        role as UserRole
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot assign this role",
      });
    }

    // -----------------------------------------
    // 10. Check unchanged role
    // -----------------------------------------

    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message:
          "User already has this role",
      });
    }

    // -----------------------------------------
    // 11. Update role
    // -----------------------------------------

    const previousRole =
      user.role;

    user.role =
      role as UserRole;

    await user.save();

    // -----------------------------------------
    // 12. Audit
    // -----------------------------------------

    await createAuditLog({
      actorId:
        authReq.user.userId,

      actorRole:
        authReq.user.role,

      action:
        "ROLE_CHANGED",

      targetUserId:
        user._id.toString(),

      metadata: {
        previousRole,
        newRole: user.role,
      },

      ipAddress:
        req.ip,

      userAgent:
        req.get("user-agent"),
    });

    // -----------------------------------------
    // 13. Response
    // -----------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "User role updated successfully",

      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        previousRole,
        role: user.role,
        status: user.status,
        updatedAt:
          user.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update user role error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
}