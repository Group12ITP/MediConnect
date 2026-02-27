const { validationResult } = require("express-validator");
const crypto = require("crypto");
const Doctor = require("../Models/Doctor");
const { generateToken, generateResetToken, verifyToken } = require("../Utils/jwtHelper");
const {
  sendWelcomeEmail,
  sendApprovalEmail,
  sendPasswordResetEmail,
} = require("../Utils/generateResetToken/emailService");

// ── Helper: Format validation errors ───────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ── Helper: Build safe doctor response (no password) ───────────
const sanitizeDoctor = (doctor) => ({
  id: doctor._id,
  doctorId: doctor.doctorId,
  firstName: doctor.firstName,
  lastName: doctor.lastName,
  email: doctor.email,
  role: doctor.role,
  specialization: doctor.specialization,
  licenseNumber: doctor.licenseNumber,
  phone: doctor.phone,
  isApproved: doctor.isApproved,
  isActive: doctor.isActive,
  createdAt: doctor.createdAt,
});

// ───────────────────────────────────────────────────────────────
// @desc    Register a new doctor
// @route   POST /api/doctors/auth/register
// @access  Public
// ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { firstName, lastName, email, password, specialization, licenseNumber, phone } = req.body;

    // Check for duplicate email or license number
    const existingDoctor = await Doctor.findOne({
      $or: [{ email }, { licenseNumber }],
    });

    if (existingDoctor) {
      const field = existingDoctor.email === email ? "email" : "license number";
      return res.status(409).json({
        success: false,
        message: `A doctor with this ${field} already exists.`,
      });
    }

    // Create doctor (password hashed via pre-save hook in model)
    const doctor = await Doctor.create({
      firstName,
      lastName,
      email,
      password,
      specialization,
      licenseNumber,
      phone,
    });

    // Send welcome email (non-blocking — don't fail registration if email fails)
    sendWelcomeEmail(doctor.email, `Dr. ${doctor.firstName} ${doctor.lastName}`).catch((err) =>
      console.error("Welcome email failed:", err.message)
    );

    return res.status(201).json({
      success: true,
      message: "Registration successful. Your account is pending admin approval.",
      data: sanitizeDoctor(doctor),
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Login doctor
// @route   POST /api/doctors/auth/login
// @access  Public
// ───────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email, password } = req.body;

    // Find doctor and include password for comparison
    const doctor = await Doctor.findOne({ email }).select("+password +tokenVersion");

    // Generic error to prevent email enumeration
    if (!doctor) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Check password
    const isPasswordCorrect = await doctor.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Check account status
    if (!doctor.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been deactivated." });
    }

    if (!doctor.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval.",
      });
    }

    // Generate JWT
    const token = generateToken({
      id: doctor._id,
      doctorId: doctor.doctorId,
      role: doctor.role,
      tokenVersion: doctor.tokenVersion,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: sanitizeDoctor(doctor),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get current logged-in doctor profile
// @route   GET /api/doctors/auth/me
// @access  Private (doctor, admin)
// ───────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.doctor._id);
    return res.status(200).json({
      success: true,
      data: sanitizeDoctor(doctor),
    });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Logout from all devices (increments tokenVersion)
// @route   POST /api/doctors/auth/logout-all
// @access  Private
// ───────────────────────────────────────────────────────────────
const logoutAll = async (req, res) => {
  try {
    await Doctor.findByIdAndUpdate(req.doctor._id, { $inc: { tokenVersion: 1 } });
    return res.status(200).json({ success: true, message: "Logged out from all devices." });
  } catch (error) {
    console.error("LogoutAll error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Forgot password – send reset email
// @route   POST /api/doctors/auth/forgot-password
// @access  Public
// ───────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { email } = req.body;
    const doctor = await Doctor.findOne({ email });

    // Always respond with same message to prevent email enumeration
    const genericResponse = {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    };

    if (!doctor) return res.status(200).json(genericResponse);

    const resetToken = generateResetToken({ id: doctor._id });

    await sendPasswordResetEmail(
      doctor.email,
      `Dr. ${doctor.firstName} ${doctor.lastName}`,
      resetToken
    );

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("ForgotPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Reset password using token from email
// @route   POST /api/doctors/auth/reset-password
// @access  Public
// ───────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { token, newPassword } = req.body;

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const doctor = await Doctor.findById(decoded.id).select("+tokenVersion");
    if (!doctor) {
      return res.status(400).json({ success: false, message: "Invalid reset token." });
    }

    doctor.password = newPassword; // Pre-save hook will hash it
    doctor.tokenVersion += 1;      // Invalidate all existing sessions
    await doctor.save();

    return res.status(200).json({ success: true, message: "Password reset successfully. Please log in." });
  } catch (error) {
    console.error("ResetPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Change password (logged in)
// @route   PUT /api/doctors/auth/change-password
// @access  Private
// ───────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { currentPassword, newPassword } = req.body;

    const doctor = await Doctor.findById(req.doctor._id).select("+password +tokenVersion");

    const isCorrect = await doctor.comparePassword(currentPassword);
    if (!isCorrect) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    doctor.password = newPassword;
    doctor.tokenVersion += 1; // Invalidate other sessions
    await doctor.save();

    // Issue a new token for current session
    const newToken = generateToken({
      id: doctor._id,
      doctorId: doctor.doctorId,
      role: doctor.role,
      tokenVersion: doctor.tokenVersion,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      token: newToken,
    });
  } catch (error) {
    console.error("ChangePassword error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Admin approves a doctor account
// @route   PATCH /api/doctors/auth/approve/:id
// @access  Private (admin only)
// ───────────────────────────────────────────────────────────────
const approveDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    if (doctor.isApproved) {
      return res.status(400).json({ success: false, message: "Doctor is already approved." });
    }

    doctor.isApproved = true;
    await doctor.save();

    // Send approval notification email
    sendApprovalEmail(
      doctor.email,
      `Dr. ${doctor.firstName} ${doctor.lastName}`
    ).catch((err) => console.error("Approval email failed:", err.message));

    return res.status(200).json({
      success: true,
      message: `Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.doctorId}) has been approved.`,
      data: sanitizeDoctor(doctor),
    });
  } catch (error) {
    console.error("ApproveDoctor error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  approveDoctor,
};