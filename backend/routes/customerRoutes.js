import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = express.Router();

// All customer routes require JWT authentication
router.get("/", authMiddleware, getCustomers);
router.post("/", authMiddleware, addCustomer);
router.patch("/:id", authMiddleware, updateCustomer);
router.delete("/:id", authMiddleware, deleteCustomer);

export default router;