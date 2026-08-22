import { Router } from "express";

import {
  getUsers,
  createUser,
  updateUserStatus,
  updateUserRole,
} from "../controllers/user.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import { requireRoles } from "../middleware/role.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRoles(
    "SUPER_ADMIN",
    "ADMIN",
    "MANAGER"
  ),
  getUsers
);

router.post(
  "/",
  requireAuth,
  requireRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  createUser
);

router.patch(
  "/:id/status",
  requireAuth,
  requireRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  updateUserStatus
);

router.patch(
  "/:id/role",
  requireAuth,
  requireRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  updateUserRole
);

export default router;