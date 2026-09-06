import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";
import {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/activityController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getActivities);
router.get("/:id", getActivity);
router.post("/", authorize("admin", "agent", "customer"), createActivity);
router.patch("/:id", authorize("admin", "agent"), updateActivity);
router.delete("/:id", authorize("admin"), deleteActivity);

export default router;
