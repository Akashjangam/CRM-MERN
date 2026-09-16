const authorize = (...allowedRoles) => {
  /*
   * Normalize allowed roles once.
   *
   * authorize("admin", "agent")
   * becomes:
   * ["admin", "agent"]
   */
  const normalizedRoles = allowedRoles.map((role) =>
    String(role || "")
      .trim()
      .toLowerCase(),
  );

  return (req, res, next) => {
    /*
     * Authentication middleware must run first.
     */
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /*
     * Normalize the authenticated user's role.
     */
    const userRole = String(req.user.role || "")
      .trim()
      .toLowerCase();

    /*
     * Debug information.
     *
     * This will appear in your backend terminal.
     */
    console.log("Authorization check:", {
      userId: req.user.id,
      userRole,
      allowedRoles: normalizedRoles,
    });

    /*
     * Missing role = forbidden.
     */
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "User role is missing.",
      });
    }

    /*
     * Check whether the authenticated user's
     * role is allowed for this route.
     */
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

export default authorize;
