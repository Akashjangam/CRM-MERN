import Activity from "../models/Activity.js";
import Customer from "../models/Customer.js";
import Case from "../models/Case.js";

export const getActivities = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.case) filter.case = req.query.case;

    const activities = await Activity.find(filter)
      .populate("customer", "name email phone")
      .populate("case", "title status priority")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: activities.length, data: activities });
  } catch (error) {
    next(error);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("case", "title status priority")
      .populate("createdBy", "name email role");

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

export const createActivity = async (req, res, next) => {
  try {
    const { customer, case: caseId, type, description } = req.body;

    if (!customer || !type || !description) {
      return res.status(400).json({
        success: false,
        message: "Customer, type and description are required",
      });
    }

    if (!(await Customer.exists({ _id: customer }))) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    if (caseId && !(await Case.exists({ _id: caseId }))) {
      return res.status(404).json({ success: false, message: "Case not found" });
    }

    const activity = await Activity.create({
      customer,
      case: caseId || null,
      type,
      description,
      createdBy: req.user.id,
    });

    const populated = await Activity.findById(activity._id)
      .populate("customer", "name email phone")
      .populate("case", "title status priority")
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.status(200).json({
      success: true,
      message: "Activity updated successfully",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    res.status(200).json({ success: true, message: "Activity deleted successfully" });
  } catch (error) {
    next(error);
  }
};
