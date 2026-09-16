import mongoose from "mongoose";

import Case from "../models/Case.js";
import Customer from "../models/Customer.js";
import User from "../models/User.js";

const CASE_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

const CASE_PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const AGENT_ROLES = ["admin", "agent"];

const ADMIN_UPDATE_FIELDS = [
  "title",
  "description",
  "priority",
  "status",
  "assignedTo",
];

const AGENT_UPDATE_FIELDS = ["title", "description", "priority", "status"];

const CUSTOMER_UPDATE_FIELDS = ["title", "description", "priority", "status"];

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const toId = (value) => {
  if (!value) return null;

  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const populateCase = (query) => {
  return query
    .populate("customer", "name email phone company status user")
    .populate("assignedTo", "name email role")
    .populate("createdBy", "name email role");
};

const serializeCase = (caseItem) => {
  const item = caseItem.toObject ? caseItem.toObject() : caseItem;

  return {
    id: item._id?.toString(),
    _id: item._id?.toString(),

    customer: item.customer || null,

    assignedTo: item.assignedTo || null,

    createdBy: item.createdBy || null,

    title: item.title,

    description: item.description,

    priority: item.priority,

    status: item.status,

    createdAt: item.createdAt,

    updatedAt: item.updatedAt,
  };
};

/*
 * Get the Customer profile connected to a User.
 *
 * If an older customer account exists without a Customer
 * document, create the missing profile automatically.
 */
const getOwnCustomer = async (userId) => {
  let customer = await Customer.findOne({
    user: userId,
  });

  if (customer) {
    return customer;
  }

  const user = await User.findById(userId).select("_id name email");

  if (!user) {
    return null;
  }

  customer = await Customer.create({
    user: user._id,
    name: user.name,
    email: user.email,
    status: "active",
  });

  return customer;
};

const validateAssignee = async (assignedTo) => {
  if (!assignedTo) {
    return {
      valid: true,
      user: null,
    };
  }

  if (!isValidObjectId(assignedTo)) {
    return {
      valid: false,
      message: "Invalid assigned user ID",
    };
  }

  const user = await User.findById(assignedTo).select("_id name email role");

  if (!user) {
    return {
      valid: false,
      message: "Assigned user not found",
    };
  }

  if (!AGENT_ROLES.includes(user.role)) {
    return {
      valid: false,
      message: "Cases can only be assigned to admin or agent users",
    };
  }

  return {
    valid: true,
    user,
  };
};

const pickFields = (body = {}, allowedFields) => {
  const updates = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  return updates;
};

const validateCaseFields = (data) => {
  if (data.priority !== undefined && !CASE_PRIORITIES.includes(data.priority)) {
    return "Invalid priority. Allowed values: Low, Medium, High, Urgent";
  }

  if (data.status !== undefined && !CASE_STATUSES.includes(data.status)) {
    return "Invalid status. Allowed values: Open, In Progress, Resolved, Closed";
  }

  return null;
};

/*
 * GET /api/cases
 */
export const getCases = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === "customer") {
      const customer = await getOwnCustomer(req.user.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      query.customer = customer._id;
    }

    const cases = await populateCase(
      Case.find(query).sort({
        createdAt: -1,
      }),
    );

    const result = cases.map(serializeCase);

    return res.status(200).json({
      success: true,
      count: result.length,
      cases: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/cases/agents
 */
export const getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({
      role: {
        $in: AGENT_ROLES,
      },
    })
      .select("_id name email role")
      .sort({
        name: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: agents.length,
      agents: agents.map((agent) => ({
        id: agent._id.toString(),
        name: agent.name,
        email: agent.email,
        role: agent.role,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/cases/:id
 */
export const getCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID",
      });
    }

    const caseItem = await populateCase(Case.findById(id));

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    if (req.user.role === "customer") {
      const customer = await getOwnCustomer(req.user.id);

      if (!customer || toId(caseItem.customer) !== customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this case",
        });
      }
    }

    return res.status(200).json({
      success: true,
      case: serializeCase(caseItem),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/cases
 */
export const createCase = async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();

    const description = String(req.body?.description || "").trim();

    const priority = req.body?.priority || "Medium";

    const status = req.body?.status || "Open";

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const validationError = validateCaseFields({
      priority,
      status,
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    let customerId;

    /*
     * Customer accounts automatically use their
     * own Customer profile.
     */
    if (req.user.role === "customer") {
      const customer = await getOwnCustomer(req.user.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      customerId = customer._id;
    } else {
      customerId = req.body?.customer;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "Customer is required",
        });
      }

      if (!isValidObjectId(customerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer ID",
        });
      }

      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }
    }

    /*
     * Customers cannot assign cases.
     */
    if (req.user.role === "customer" && req.body?.assignedTo) {
      return res.status(403).json({
        success: false,
        message: "Customers cannot assign cases",
      });
    }

    let assignedTo = null;

    if (req.body?.assignedTo && req.user.role !== "customer") {
      const result = await validateAssignee(req.body.assignedTo);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          message: result.message,
        });
      }

      assignedTo = result.user._id;
    }

    const caseItem = await Case.create({
      customer: customerId,
      assignedTo,
      createdBy: req.user.id,
      title,
      description,
      priority,
      status,
    });

    const populatedCase = await populateCase(Case.findById(caseItem._id));

    return res.status(201).json({
      success: true,
      message: "Case created successfully",
      case: serializeCase(populatedCase),
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid case data",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
};

/*
 * PATCH /api/cases/:id
 */
export const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID",
      });
    }

    const existingCase = await Case.findById(id);

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    /*
     * CUSTOMER
     */
    if (req.user.role === "customer") {
      const customer = await getOwnCustomer(req.user.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      if (existingCase.customer.toString() !== customer._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this case",
        });
      }

      if (
        req.body.customer !== undefined ||
        req.body.assignedTo !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: "Customers cannot change case ownership or assignment",
        });
      }

      const updates = pickFields(req.body, CUSTOMER_UPDATE_FIELDS);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid case fields were provided",
        });
      }

      if (updates.title !== undefined) {
        updates.title = String(updates.title).trim();

        if (!updates.title) {
          return res.status(400).json({
            success: false,
            message: "Title is required",
          });
        }
      }

      if (updates.description !== undefined) {
        updates.description = String(updates.description).trim();

        if (!updates.description) {
          return res.status(400).json({
            success: false,
            message: "Description is required",
          });
        }
      }

      const validationError = validateCaseFields(updates);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const updatedCase = await Case.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      const populatedCase = await populateCase(Case.findById(updatedCase._id));

      return res.status(200).json({
        success: true,
        message: "Case updated successfully",
        case: serializeCase(populatedCase),
      });
    }

    /*
     * AGENT
     */
    if (req.user.role === "agent") {
      if (
        !existingCase.assignedTo ||
        existingCase.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update cases assigned to you",
        });
      }

      if (
        req.body.customer !== undefined ||
        req.body.assignedTo !== undefined
      ) {
        return res.status(403).json({
          success: false,
          message: "Agents cannot change case ownership or assignment",
        });
      }

      const updates = pickFields(req.body, AGENT_UPDATE_FIELDS);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid case fields were provided",
        });
      }

      if (updates.title !== undefined) {
        updates.title = String(updates.title).trim();

        if (!updates.title) {
          return res.status(400).json({
            success: false,
            message: "Title is required",
          });
        }
      }

      if (updates.description !== undefined) {
        updates.description = String(updates.description).trim();

        if (!updates.description) {
          return res.status(400).json({
            success: false,
            message: "Description is required",
          });
        }
      }

      const validationError = validateCaseFields(updates);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      const updatedCase = await Case.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      const populatedCase = await populateCase(Case.findById(updatedCase._id));

      return res.status(200).json({
        success: true,
        message: "Case updated successfully",
        case: serializeCase(populatedCase),
      });
    }

    /*
     * ADMIN
     */
    if (req.user.role === "admin") {
      const updates = pickFields(req.body, ADMIN_UPDATE_FIELDS);

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid case fields were provided",
        });
      }

      if (updates.title !== undefined) {
        updates.title = String(updates.title).trim();

        if (!updates.title) {
          return res.status(400).json({
            success: false,
            message: "Title is required",
          });
        }
      }

      if (updates.description !== undefined) {
        updates.description = String(updates.description).trim();

        if (!updates.description) {
          return res.status(400).json({
            success: false,
            message: "Description is required",
          });
        }
      }

      const validationError = validateCaseFields(updates);

      if (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError,
        });
      }

      if (updates.assignedTo !== undefined) {
        if (updates.assignedTo === null || updates.assignedTo === "") {
          updates.assignedTo = null;
        } else {
          const result = await validateAssignee(updates.assignedTo);

          if (!result.valid) {
            return res.status(400).json({
              success: false,
              message: result.message,
            });
          }

          updates.assignedTo = result.user._id;
        }
      }

      const updatedCase = await Case.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      const populatedCase = await populateCase(Case.findById(updatedCase._id));

      return res.status(200).json({
        success: true,
        message: "Case updated successfully",
        case: serializeCase(populatedCase),
      });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission to update this case",
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid case data",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
};

/*
 * DELETE /api/cases/:id
 */
export const deleteCase = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid case ID",
      });
    }

    const caseItem = await Case.findById(id);

    if (!caseItem) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    if (req.user.role === "agent") {
      if (
        !caseItem.assignedTo ||
        caseItem.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only delete cases assigned to you",
        });
      }
    }

    await Case.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Case deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
