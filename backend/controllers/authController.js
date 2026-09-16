import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import Customer from "../models/Customer.js";

/*
 * Create JWT for an authenticated user.
 */
const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
};

/*
 * Normalize and validate email.
 */
const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

/*
 * Return only safe user information.
 * Never send password/hash to frontend.
 */
const serializeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

/*
 * POST /api/auth/register
 *
 * Public registration always creates a CUSTOMER.
 * A public request can never create an admin or agent.
 */
export const register = async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must not exceed 100 characters",
      });
    }

    if (!email.includes("@") || !email.includes(".")) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    /*
     * Do not accept role from public registration.
     *
     * This prevents someone from sending:
     * { role: "admin" }
     *
     * and creating a privileged account.
     */
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    /*
     * Hash password before storing it.
     */
    const hashedPassword = await bcrypt.hash(password, 10);

    /*
     * Public registration always creates customer.
     */
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    });

    /*
     * Every customer account gets a corresponding
     * Customer CRM profile.
     */
    try {
      await Customer.create({
        user: user._id,
        name: user.name,
        email: user.email,
        phone: "",
        company: "",
        status: "active",
        createdBy: user._id,
      });
    } catch (customerError) {
      /*
       * Avoid leaving an authentication user without
       * its required customer profile.
       */
      await User.findByIdAndDelete(user._id);

      throw customerError;
    }

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    /*
     * MongoDB duplicate-key protection.
     */
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    next(error);
  }
};

/*
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    /*
     * Explicitly select password because User model may
     * hide it using select: false.
     */
    const user = await User.findOne({ email }).select("+password");

    /*
     * Use the same generic message for both cases:
     * - user does not exist
     * - password is incorrect
     *
     * This avoids revealing whether an email exists.
     */
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/*
 * GET /api/auth/me
 *
 * Returns the currently authenticated user.
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: serializeUser(user),
    });
  } catch (error) {
    next(error);
  }
};
