import express from "express";

import {
  getCases,
  createCase,
  updateCase,
  deleteCase,
} from "../controllers/caseController.js";

const router = express.Router();

// Get all cases
router.get("/", getCases);

// Create a new case
router.post("/", createCase);

// Update a case
router.patch("/:id", updateCase);

// Delete a case
router.delete("/:id", deleteCase);

export default router;