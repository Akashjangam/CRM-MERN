import User from "../models/User.js";

const ALLOWED_ROLES = ["admin", "agent", "customer"];

/*
 * Return safe user data.
 * Never expose password/hash fields.
 */
const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/*
 * GET /api/users
 *
 * Admin only.
 * Returns all CRM users without passwords.
 */
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * PATCH /api/users/:id/role
 *
 * Admin only.
 * Allows an administrator to change another user's role.
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const role = String(req.body?.role || "")
      .trim()
      .toLowerCase();

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: admin, agent, customer",
      });
    }

    /*
     * Prevent an administrator from accidentally changing
     * their own role and locking themselves out.
     */
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: serializeUser(user),
    });
  } catch (error) {
    /*
     * Invalid MongoDB ObjectId.
     */
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    next(error);
  }
};