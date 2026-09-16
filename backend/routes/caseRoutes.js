import express from "express";

import {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase,
  getAgents,
} from "../controllers/caseController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/*
 * All case routes require authentication.
 */
router.use(authMiddleware);

/*
 * GET /api/cases
 *
 * Admin, agent and customer.
 * Controller applies role-based data scoping.
 */
router.get("/", getCases);

/*
 * GET /api/cases/agents
 *
 * Admin and agent only.
 *
 * IMPORTANT:
 * This route must appear before /:id.
 */
router.get(
  "/agents",
  authorize("admin", "agent"),
  getAgents
);

/*
 * GET /api/cases/:id
 */
router.get("/:id", getCase);

/*
 * POST /api/cases
 *
 * Admin, agent and customer can create cases.
 * The controller applies role-specific restrictions.
 */
router.post(
  "/",
  authorize("admin", "agent", "customer"),
  createCase
);

/*
 * PATCH /api/cases/:id
 *
 * All authenticated roles may reach the controller.
 * The controller determines what each role can modify.
 */
router.patch("/:id", updateCase);

/*
 * DELETE /api/cases/:id
 *
 * Admin and agent only.
 * The controller additionally restricts agents
 * to their own assigned cases.
 */
router.delete(
  "/:id",
  authorize("admin", "agent"),
  deleteCase
);

export default router;