const { verifyToken } = require("../Utils/jwtHelper");
const Doctor = require("../Models/Doctor");

/**
 * protect – Verifies JWT and attaches doctor to req.doctor
 * Use on any route that requires authentication
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Check if doctor still exists and is active
    const doctor = await Doctor.findById(decoded.id).select("+tokenVersion");
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "The account associated with this token no longer exists.",
      });
    }

    if (!doctor.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // 4. Check token version (invalidates tokens after logout-all)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== doctor.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    // 5. Attach doctor to request
    req.doctor = doctor;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired. Please log in again." });
    }
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

/**
 * restrictTo – Role-based access control
 * Usage: restrictTo("admin") or restrictTo("admin", "doctor")
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.doctor.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}.`,
      });
    }
    next();
  };
};

/**
 * requireApproved – Ensures the doctor account is approved by admin
 * Use AFTER protect middleware
 */
const requireApproved = (req, res, next) => {
  if (!req.doctor.isApproved) {
    return res.status(403).json({
      success: false,
      message: "Your account is pending admin approval. Please wait for confirmation.",
    });
  }
  next();
};

module.exports = { protect, restrictTo, requireApproved };