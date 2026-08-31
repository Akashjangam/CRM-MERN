import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getCases,
  createCase,
  updateCase,
  deleteCase,
} from "../controllers/caseController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCases);
router.post("/", createCase);
router.patch("/:id", updateCase);
router.delete("/:id", deleteCase);

export default router;