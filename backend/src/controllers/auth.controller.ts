import mongoose from "mongoose";
import { Request, Response } from "express";
import { User } from "../models/User.js";
import {
  comparePassword,
  hashPassword,
} from "../utils/password.js";
import { createAuditLog } from "../services/audit.service.js";
import { generateAccessToken } from "../utils/jwt.js";

export async function bootstrapSuperAdmin(
  req: Request,
  res: Response
) {
  try {
    const existingSuperAdmin = await User.exists({
      role: "SUPER_ADMIN",
    });

    if (existingSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Super Admin has already been initialized",
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Bootstrap Super Admin error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function getCurrentUser(
  req: Request,
  res: Response
) {
  try {
    const authReq = req as Request & {
      user?: {
        userId: string;
        role: string;
      };
    };

    if (!authReq.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(
      authReq.user.userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function login(
  req: Request,
  res: Response
) {
  try {
    const { email, password } = req.body;

    // -----------------------------------------
    // 1. Validate request
    // -----------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Normalize email
    const normalizedEmail =
      email.trim().toLowerCase();

    // -----------------------------------------
    // 2. Find user
    // -----------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // -----------------------------------------
    // 3. User doesn't exist
    // -----------------------------------------

    if (!user) {
      await createAuditLog({
        action: "LOGIN_FAILED",

        metadata: {
          email: normalizedEmail,
          reason: "USER_NOT_FOUND",
        },

        ipAddress: req.ip,

        userAgent:
          req.get("user-agent"),
      });

      // Don't reveal whether the email exists
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -----------------------------------------
    // 4. Check account status
    // -----------------------------------------

    if (user.status === "SUSPENDED") {
      await createAuditLog({
        actorId: user._id.toString(),

        actorRole: user.role,

        action: "LOGIN_FAILED",

        metadata: {
          reason: "ACCOUNT_SUSPENDED",
        },

        ipAddress: req.ip,

        userAgent:
          req.get("user-agent"),
      });

      return res.status(403).json({
        success: false,
        message:
          "Your account has been suspended",
      });
    }

    // -----------------------------------------
    // 5. Compare password
    // -----------------------------------------

    const passwordValid =
      await comparePassword(
        password,
        user.passwordHash
      );

    // -----------------------------------------
    // 6. Invalid password
    // -----------------------------------------

    if (!passwordValid) {
      await createAuditLog({
        actorId: user._id.toString(),

        actorRole: user.role,

        action: "LOGIN_FAILED",

        metadata: {
          reason: "INVALID_PASSWORD",
        },

        ipAddress: req.ip,

        userAgent:
          req.get("user-agent"),
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -----------------------------------------
    // 7. Generate JWT
    // -----------------------------------------

    const accessToken =
      generateAccessToken({
        userId: user._id.toString(),
        role: user.role,
      });

    // -----------------------------------------
    // 8. Set HttpOnly cookie
    // -----------------------------------------

    res.cookie(
      "users_access_token",
      accessToken,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite:
          process.env.NODE_ENV ===
          "production"
            ? "none"
            : "lax",

        maxAge:
          1000 * 60 * 60, // 1 hour

        path: "/",
      }
    );

    // -----------------------------------------
    // 9. Audit successful login
    // -----------------------------------------

    await createAuditLog({
      actorId: user._id.toString(),

      actorRole: user.role,

      action: "LOGIN_SUCCESS",

      ipAddress: req.ip,

      userAgent:
        req.get("user-agent"),
    });

    // -----------------------------------------
    // 10. Return safe user data
    // -----------------------------------------

    return res.status(200).json({
      success: true,

      message: "Login successful",

      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function logout(
  _req: Request,
  res: Response
) {
  res.clearCookie("users_access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production"
      ? "none"
      : "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
}