import { Router } from "express";

import {
  getAuditLogs,
} from "../controllers/audit.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

import {
  requireRoles,
} from "../middleware/role.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  requireRoles(
    "SUPER_ADMIN",
    "ADMIN"
  ),
  getAuditLogs
);

export default router;