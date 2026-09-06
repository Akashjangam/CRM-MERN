import Case from "../models/Case.js";
import User from "../models/User.js";
import Customer from "../models/Customer.js";

/*
|--------------------------------------------------------------------------
| GET ALL CASES
|--------------------------------------------------------------------------
*/

export const getCases = async (req, res, next) => {
  try {
    const cases = await Case.find()
      .populate("customer", "name email phone company")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cases.length,
      data: cases,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE CASE
|--------------------------------------------------------------------------
*/

export const getCase = async (req, res, next) => {
  try {
    const item = await Case.findById(req.params.id)
      .populate("customer", "name email phone company")
      .populate("assignedTo", "name email role");

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| CREATE CASE
|--------------------------------------------------------------------------
*/

export const createCase = async (req, res, next) => {
  try {
    const {
      customer,
      title,
      description,
      priority,
      status,
      assignedTo,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Customer creating a case
    | Automatically attach the logged-in customer's customer record.
    |--------------------------------------------------------------------------
    */

    let customerId = customer;

    if (req.user.role === "customer") {
      const loggedInCustomer = await Customer.findOne({
        user: req.user.id,
      });

      if (!loggedInCustomer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      customerId = loggedInCustomer._id;
    }

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer is required",
      });
    }

    const customerExists = await Customer.exists({
      _id: customerId,
    });

    if (!customerExists) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate assigned agent
    |--------------------------------------------------------------------------
    */

    if (assignedTo) {
      const assignee = await User.findById(assignedTo);

      if (
        !assignee ||
        !["admin", "agent"].includes(assignee.role)
      ) {
        return res.status(400).json({
          success: false,
          message: "assignedTo must reference an admin or agent",
        });
      }
    }

    const newCase = await Case.create({
      customer: customerId,
      title,
      description,
      priority: priority || "Medium",
      status: status || "Open",
      assignedTo: assignedTo || null,
    });

    const populatedCase = await Case.findById(newCase._id)
      .populate("customer", "name email phone company")
      .populate("assignedTo", "name email role");

    res.status(201).json({
      success: true,
      message: "Case created successfully",
      data: populatedCase,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE CASE
|--------------------------------------------------------------------------
*/

export const updateCase = async (req, res, next) => {
  try {
    const caseId = req.params.id;

    const existingCase = await Case.findById(caseId);

    if (!existingCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    | Admin can update anything.
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "admin") {
      const updates = { ...req.body };

      if (updates.assignedTo) {
        const assignee = await User.findById(updates.assignedTo);

        if (
          !assignee ||
          !["admin", "agent"].includes(assignee.role)
        ) {
          return res.status(400).json({
            success: false,
            message: "assignedTo must reference an admin or agent",
          });
        }
      }

      const updatedCase = await Case.findByIdAndUpdate(
        caseId,
        updates,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("customer", "name email phone company")
        .populate("assignedTo", "name email role");

      return res.status(200).json({
        success: true,
        message: "Case updated successfully",
        data: updatedCase,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | AGENT
    | Agent can update cases assigned to them.
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "agent") {
      if (
        existingCase.assignedTo &&
        existingCase.assignedTo.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update cases assigned to you",
        });
      }

      const updates = {
        ...req.body,
      };

      /*
      | Agent cannot change case ownership/customer.
      */

      delete updates.customer;

      /*
      | Validate assignedTo if agent changes it.
      */

      if (updates.assignedTo) {
        const assignee = await User.findById(updates.assignedTo);

        if (
          !assignee ||
          !["admin", "agent"].includes(assignee.role)
        ) {
          return res.status(400).json({
            success: false,
            message: "assignedTo must reference an admin or agent",
          });
        }
      }

      const updatedCase = await Case.findByIdAndUpdate(
        caseId,
        updates,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("customer", "name email phone company")
        .populate("assignedTo", "name email role");

      return res.status(200).json({
        success: true,
        message: "Case updated successfully",
        data: updatedCase,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CUSTOMER
    | Customer can update ONLY their own case.
    |--------------------------------------------------------------------------
    */

    if (req.user.role === "customer") {
      const customer = await Customer.findOne({
        user: req.user.id,
      });

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer profile not found",
        });
      }

      if (
        existingCase.customer.toString() !==
        customer._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own cases",
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Customer cannot modify protected fields.
      |--------------------------------------------------------------------------
      */

      const allowedUpdates = {};

      if (req.body.title !== undefined) {
        allowedUpdates.title = req.body.title;
      }

      if (req.body.description !== undefined) {
        allowedUpdates.description = req.body.description;
      }

      if (req.body.priority !== undefined) {
        allowedUpdates.priority = req.body.priority;
      }

      if (req.body.status !== undefined) {
        allowedUpdates.status = req.body.status;
      }

      const updatedCase = await Case.findByIdAndUpdate(
        caseId,
        allowedUpdates,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("customer", "name email phone company")
        .populate("assignedTo", "name email role");

      return res.status(200).json({
        success: true,
        message: "Case updated successfully",
        data: updatedCase,
      });
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission to update this case",
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| DELETE CASE
|--------------------------------------------------------------------------
*/

export const deleteCase = async (req, res, next) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(
      req.params.id
    );

    if (!deletedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Case deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| GET AGENTS
|--------------------------------------------------------------------------
*/

export const getAgents = async (req, res, next) => {
  try {
    const agents = await User.find({
      role: {
        $in: ["admin", "agent"],
      },
    }).select("name email role");

    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents,
    });
  } catch (error) {
    next(error);
  }
};