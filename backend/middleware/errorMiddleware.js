const errorMiddleware = (err, req, res, next) => {
  console.error("API ERROR:", {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
  });

  /*
   * Mongoose validation error
   */
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((error) => error.message);

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  /*
   * Invalid MongoDB ObjectId
   */
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }

  /*
   * MongoDB duplicate key error
   */
  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});

    return res.status(409).json({
      success: false,
      message: fields.length
        ? `Duplicate value for: ${fields.join(", ")}`
        : "Duplicate value already exists",
    });
  }

  /*
   * JWT errors that reach the centralized handler.
   */
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }

  /*
   * Explicit application errors.
   */
  const statusCode = Number.isInteger(err.statusCode)
    ? err.statusCode
    : Number.isInteger(err.status)
      ? err.status
      : 500;

  /*
   * Never expose internal server details in production.
   */
  const message =
    statusCode >= 500
      ? "Internal server error"
      : err.message || "Something went wrong";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;
