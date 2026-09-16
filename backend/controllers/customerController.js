import mongoose from "mongoose";

import Customer from "../models/Customer.js";

/*
 * Fields that can safely be changed by an admin/agent.
 *
 * Do NOT allow clients to modify:
 * - _id
 * - user
 * - createdBy
 */
const UPDATE_FIELDS = ["name", "email", "phone", "company", "status"];

/*
 * Check whether an ID is a valid MongoDB ObjectId.
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*
 * Return safe customer data.
 */
const serializeCustomer = (customer) => {
  const item = customer.toObject ? customer.toObject() : customer;

  return {
    id: item._id?.toString(),
    user: item.user?.toString?.() || item.user || null,
    name: item.name,
    email: item.email,
    phone: item.phone || "",
    company: item.company || "",
    status: item.status,
    createdBy: item.createdBy?.toString?.() || item.createdBy || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

/*
 * Pick only fields allowed for customer updates.
 */
const pickUpdateFields = (body = {}) => {
  const updates = {};

  for (const field of UPDATE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  return updates;
};

/*
 * GET /api/customers
 *
 * Admin/Agent:
 *   See all customers.
 *
 * Customer:
 *   See only their own CRM customer profile.
 */
export const getCustomers = async (req, res, next) => {
  try {
    let customers;

    if (req.user.role === "customer") {
      customers = await Customer.find({
        user: req.user.id,
      })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      customers = await Customer.find({}).sort({ createdAt: -1 }).lean();
    }

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers: customers.map((customer) => ({
        id: customer._id.toString(),
        user: customer.user?.toString?.() || customer.user || null,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        company: customer.company || "",
        status: customer.status,
        createdBy:
          customer.createdBy?.toString?.() || customer.createdBy || null,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/customers/:id
 */
export const getCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(id).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Customers can only access their own profile.
     */
    if (
      req.user.role === "customer" &&
      customer.user?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this customer",
      });
    }

    return res.status(200).json({
      success: true,
      customer: {
        id: customer._id.toString(),
        user: customer.user?.toString?.() || customer.user || null,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        company: customer.company || "",
        status: customer.status,
        createdBy:
          customer.createdBy?.toString?.() || customer.createdBy || null,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/customers
 *
 * Admin/Agent only through route authorization.
 */
export const addCustomer = async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const phone = String(req.body?.phone || "").trim();
    const company = String(req.body?.company || "").trim();
    const status = req.body?.status || "active";

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name, email and phone are required",
      });
    }

    if (!email.includes("@") || !email.includes(".")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer status",
      });
    }

    /*
     * Prevent duplicate customer email records.
     */
    const existingCustomer = await Customer.findOne({ email });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "A customer already exists with this email",
      });
    }

    const customer = await Customer.create({
      name,
      email,
      phone,
      company,
      status,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: serializeCustomer(customer),
    });
  } catch (error) {
    /*
     * MongoDB duplicate-key protection.
     */
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A customer already exists with this email",
      });
    }

    next(error);
  }
};

/*
 * PATCH /api/customers/:id
 *
 * Admin/Agent only through route authorization.
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const updates = pickUpdateFields(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid customer fields were provided",
      });
    }

    /*
     * Normalize fields.
     */
    if (updates.name !== undefined) {
      updates.name = String(updates.name).trim();

      if (!updates.name) {
        return res.status(400).json({
          success: false,
          message: "Customer name is required",
        });
      }
    }

    if (updates.email !== undefined) {
      updates.email = String(updates.email).trim().toLowerCase();

      if (!updates.email.includes("@") || !updates.email.includes(".")) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        });
      }
    }

    if (updates.phone !== undefined) {
      updates.phone = String(updates.phone).trim();
    }

    if (updates.company !== undefined) {
      updates.company = String(updates.company).trim();
    }

    if (
      updates.status !== undefined &&
      !["active", "inactive"].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer status",
      });
    }

    /*
     * Check that customer exists before updating.
     */
    const existingCustomer = await Customer.findById(id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
     * Check email uniqueness when email is changed.
     */
    if (updates.email && updates.email !== existingCustomer.email) {
      const duplicateEmail = await Customer.findOne({
        email: updates.email,
        _id: { $ne: id },
      });

      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          message: "A customer already exists with this email",
        });
      }
    }

    const customer = await Customer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: serializeCustomer(customer),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A customer already exists with this email",
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid customer data",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
};

/*
 * DELETE /api/customers/:id
 *
 * Admin only through route authorization.
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await Customer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
