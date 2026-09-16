import express from "express";

import {
  getUsers,
  updateUserRole,
} from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/*
 * All user-management routes require authentication
 * and admin privileges.
 */
router.use(authMiddleware);
router.use(authorize("admin"));

/*
 * GET /api/users
 */
router.get("/", getUsers);

/*
 * PATCH /api/users/:id/role
 */
router.patch("/:id/role", updateUserRole);

export default router;