import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authorization header is required.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Bearer token is required.",
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token is missing.",
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured.",
      });
    }

    const decoded = jwt.verify(token, secret);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    /*
     * Normalize the role from the JWT.
     *
     * Example:
     * "Admin" -> "admin"
     * " admin " -> "admin"
     */
    const role = String(decoded.role || "")
      .trim()
      .toLowerCase();

    if (!role) {
      return res.status(401).json({
        success: false,
        message: "Authentication token does not contain a valid role.",
      });
    }

    req.user = {
      id: decoded.id,
      role,
    };

    /*
     * Temporary server-side debugging.
     * You can remove this after confirming the role works.
     */
    console.log("Authenticated user:", {
      id: req.user.id,
      role: req.user.role,
    });

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    if (error?.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default authMiddleware;
