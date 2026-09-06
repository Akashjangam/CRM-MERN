import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import { getUsers, updateUserRole } from "../controllers/userController.js";

const router = express.Router();

// Authentication required for all user routes
router.use(authMiddleware);

// Only Admin can view all users
router.get("/", authorize("admin"), getUsers);

// Only Admin can change a user's role
router.patch("/:id/role", authorize("admin"), updateUserRole);

export default router;
