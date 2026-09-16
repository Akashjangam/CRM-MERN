import express from "express";

import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activityController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/*
 * All activity routes require authentication.
 */
router.use(authMiddleware);

/*
 * GET /api/activities
 *
 * Admin, agent and customer.
 * Controller applies customer-level data scoping.
 */
router.get("/", getActivities);

/*
 * GET /api/activities/:id
 *
 * Controller verifies customer ownership where required.
 */
router.get("/:id", getActivity);

/*
 * POST /api/activities
 *
 * Admin, agent and customer can create activities.
 * Customer access is restricted by the controller
 * to their own customer/case records.
 */
router.post("/", authorize("admin", "agent", "customer"), createActivity);

/*
 * PATCH /api/activities/:id
 *
 * Only admin and agent can update activities.
 */
router.patch("/:id", authorize("admin", "agent"), updateActivity);

/*
 * DELETE /api/activities/:id
 *
 * Only admin can delete activities.
 */
router.delete("/:id", authorize("admin"), deleteActivity);

export default router;
