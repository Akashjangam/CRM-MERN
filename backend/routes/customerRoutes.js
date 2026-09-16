import express from "express";

import {
  getCustomers,
  getCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

/*
 * All customer routes require authentication.
 */
router.use(authMiddleware);

/*
 * GET /api/customers
 *
 * Admin, agent and customer can view.
 *
 * Customer users are restricted to their own
 * customer profile inside the controller.
 */
router.get("/", getCustomers);

/*
 * GET /api/customers/:id
 *
 * Admin, agent and customer can access the route.
 *
 * Customer ownership is checked inside the controller.
 */
router.get("/:id", getCustomer);

/*
 * POST /api/customers
 *
 * Only admin and agent can create CRM customer records.
 */
router.post("/", authorize("admin", "agent"), addCustomer);

/*
 * PATCH /api/customers/:id
 *
 * Admin and agent can update customers.
 */
router.patch("/:id", authorize("admin", "agent"), updateCustomer);

/*
 * DELETE /api/customers/:id
 *
 * Only admin can delete customers.
 */
router.delete("/:id", authorize("admin"), deleteCustomer);

export default router;
