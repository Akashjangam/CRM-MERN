import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";
import {
  getCustomers,
  getCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getCustomers);
router.get("/:id", getCustomer);
router.post("/", authorize("admin", "agent"), addCustomer);
router.patch("/:id", authorize("admin", "agent"), updateCustomer);
router.delete("/:id", authorize("admin"), deleteCustomer);

export default router;
