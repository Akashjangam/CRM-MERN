import mongoose from "mongoose";

import Activity from "../models/Activity.js";
import Customer from "../models/Customer.js";
import Case from "../models/Case.js";
import User from "../models/User.js";

const ACTIVITY_TYPES = ["call", "email", "meeting", "note", "follow-up"];

const UPDATE_FIELDS = ["type", "description"];

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const serializeActivity = (activity) => {
  const item = activity.toObject ? activity.toObject() : activity;

  return {
    id: item._id?.toString(),
    _id: item._id?.toString(),

    customer: item.customer || null,

    case: item.case || null,

    type: item.type,

    description: item.description,

    createdBy: item.createdBy || null,

    createdAt: item.createdAt,

    updatedAt: item.updatedAt,
  };
};

const getOwnCustomer = async (userId) => {
  let customer = await Customer.findOne({
    user: userId,
  });

  /*
   * Repair older customer accounts that do not have
   * a linked Customer document.
   */
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

const populateActivity = (query) => {
  return query
    .populate("customer", "name email phone company status user")
    .populate("case", "title status priority")
    .populate("createdBy", "name email role");
};

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
 * GET /api/activities
 */
export const getActivities = async (req, res, next) => {
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

    const activities = await populateActivity(
      Activity.find(query).sort({
        createdAt: -1,
      }),
    );

    const result = activities.map(serializeActivity);

    return res.status(200).json({
      success: true,
      count: result.length,
      activities: result,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/activities/:id
 */
export const getActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const activity = await populateActivity(Activity.findById(id));

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    if (req.user.role === "customer") {
      const customer = await getOwnCustomer(req.user.id);

      if (
        !customer ||
        activity.customer?._id?.toString() !== customer._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this activity",
        });
      }
    }

    return res.status(200).json({
      success: true,
      activity: serializeActivity(activity),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * POST /api/activities
 */
export const createActivity = async (req, res, next) => {
  try {
    const type = String(req.body?.type || "")
      .trim()
      .toLowerCase();

    const description = String(req.body?.description || "").trim();

    if (!ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity type",
      });
    }

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Activity description is required",
      });
    }

    let customerId;

    /*
     * Customer accounts automatically use
     * their own profile.
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

    let caseId = null;

    if (req.body?.case) {
      if (!isValidObjectId(req.body.case)) {
        return res.status(400).json({
          success: false,
          message: "Invalid case ID",
        });
      }

      const caseItem = await Case.findById(req.body.case);

      if (!caseItem) {
        return res.status(404).json({
          success: false,
          message: "Case not found",
        });
      }

      if (caseItem.customer.toString() !== customerId.toString()) {
        return res.status(400).json({
          success: false,
          message: "Case does not belong to the selected customer",
        });
      }

      caseId = caseItem._id;
    }

    const activity = await Activity.create({
      customer: customerId,
      case: caseId,
      type,
      description,
      createdBy: req.user.id,
    });

    const populatedActivity = await populateActivity(
      Activity.findById(activity._id),
    );

    return res.status(201).json({
      success: true,
      message: "Activity created successfully",
      activity: serializeActivity(populatedActivity),
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid activity data",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
};

/*
 * PATCH /api/activities/:id
 */
export const updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const updates = pickUpdateFields(req.body);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid activity fields were provided",
      });
    }

    if (updates.type !== undefined) {
      updates.type = String(updates.type).trim().toLowerCase();

      if (!ACTIVITY_TYPES.includes(updates.type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid activity type",
        });
      }
    }

    if (updates.description !== undefined) {
      updates.description = String(updates.description).trim();

      if (!updates.description) {
        return res.status(400).json({
          success: false,
          message: "Activity description is required",
        });
      }
    }

    const updatedActivity = await Activity.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    const populatedActivity = await populateActivity(
      Activity.findById(updatedActivity._id),
    );

    return res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      activity: serializeActivity(populatedActivity),
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid activity data",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    next(error);
  }
};

/*
 * DELETE /api/activities/:id
 */
export const deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid activity ID",
      });
    }

    const activity = await Activity.findById(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    await Activity.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
