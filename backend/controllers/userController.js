import User from "../models/User.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("name email role createdAt updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    // Allow only these roles
    if (!["admin", "agent", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Use admin, agent, or customer.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email role createdAt updatedAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};