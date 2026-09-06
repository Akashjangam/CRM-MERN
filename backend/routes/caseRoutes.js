import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

import {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  getAgents,
} from "../controllers/caseController.js";

const router = express.Router();

// All case routes require login
router.use(authMiddleware);

// Get all cases
router.get("/", getCases);

// Get available agents
router.get(
  "/agents",
  authorize("admin", "agent"),
  getAgents
);

// Get single case
router.get("/:id", getCase);

// Create case
router.post(
  "/",
  authorize("admin", "agent", "customer"),
  createCase
);

// Update case
router.patch(
  "/:id",
  authorize("admin", "agent", "customer"),
  updateCase
);

// Delete case
// Admin + Agent can delete
router.delete(
  "/:id",
  authorize("admin", "agent"),
  deleteCase
);

export default router;