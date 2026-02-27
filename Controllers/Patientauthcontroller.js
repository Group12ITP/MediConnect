const { validationResult } = require("express-validator");
const Patient = require("../Models/Patient");
const { generateToken, generateResetToken, verifyToken } = require("../utils/jwtHelper");
const {
  sendPatientWelcomeEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");

// ── Helper: Validation errors ───────────────────────────────────
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

// ── Helper: Safe patient response ──────────────────────────────
const sanitize = (p) => ({
  id:              p._id,
  patientId:       p.patientId,
  firstName:       p.firstName,
  lastName:        p.lastName,
  email:           p.email,
  role:            p.role,
  phone:           p.phone,
  dateOfBirth:     p.dateOfBirth,
  gender:          p.gender,
  bloodGroup:      p.bloodGroup,
  address:         p.address,
  assignedDoctor:  p.assignedDoctor,
  isActive:        p.isActive,
  createdAt:       p.createdAt,
});

// ───────────────────────────────────────────────────────────────
// @desc    Register new patient
// @route   POST /api/patients/auth/register
// @access  Public
// ───────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const err = handleValidationErrors(req, res);
  if (err) return;

  try {
    const {
      firstName, lastName, email, password,
      phone, dateOfBirth, gender, bloodGroup,
    } = req.body;

    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const patient = await Patient.create({
      firstName, lastName, email, password,
      phone, dateOfBirth, gender, bloodGroup,
    });

    sendPatientWelcomeEmail(
      patient.email,
      `${patient.firstName} ${patient.lastName}`
    );

    const token = generateToken({
      id:        patient._id,
      patientId: patient.patientId,
      role:      "patient",
      tokenVersion: patient.tokenVersion,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      data: sanitize(patient),
    });
  } catch (error) {
    console.error("Patient register error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Patient login
// @route   POST /api/patients/auth/login
// @access  Public
// ───────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const err = handleValidationErrors(req, res);
  if (err) return;

  try {
    const { email, password } = req.body;

    const patient = await Patient.findOne({ email })
      .select("+password +tokenVersion");

    if (!patient) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await patient.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!patient.isActive) {
      return res.status(403).json({ success: false, message: "Your account has been deactivated." });
    }

    const token = generateToken({
      id:           patient._id,
      patientId:    patient.patientId,
      role:         "patient",
      tokenVersion: patient.tokenVersion,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: sanitize(patient),
    });
  } catch (error) {
    console.error("Patient login error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get own profile
// @route   GET /api/patients/auth/me
// @access  Private (patient)
// ───────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user._id)
      .populate("assignedDoctor", "firstName lastName specialization doctorId");
    return res.status(200).json({ success: true, data: sanitize(patient) });
  } catch (error) {
    console.error("Patient getMe error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Update own profile (name, phone, address, etc.)
// @route   PUT /api/patients/auth/me
// @access  Private (patient)
// ───────────────────────────────────────────────────────────────
const updateMe = async (req, res) => {
  const err = handleValidationErrors(req, res);
  if (err) return;

  try {
    const allowedFields = [
      "firstName", "lastName", "phone",
      "dateOfBirth", "gender", "bloodGroup", "address",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const patient = await Patient.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate("assignedDoctor", "firstName lastName specialization doctorId");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: sanitize(patient),
    });
  } catch (error) {
    console.error("Patient updateMe error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Logout all devices
// @route   POST /api/patients/auth/logout-all
// @access  Private (patient)
// ───────────────────────────────────────────────────────────────
const logoutAll = async (req, res) => {
  try {
    await Patient.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    return res.status(200).json({ success: true, message: "Logged out from all devices." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Forgot password
// @route   POST /api/patients/auth/forgot-password
// @access  Public
// ───────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const err = handleValidationErrors(req, res);
  if (err) return;

  try {
    const { email } = req.body;
    const patient = await Patient.findOne({ email });

    const generic = {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    };

    if (!patient) return res.status(200).json(generic);

    const resetToken = generateResetToken({ id: patient._id, role: "patient" });
    await sendPasswordResetEmail(
      patient.email,
      `${patient.firstName} ${patient.lastName}`,
      resetToken,
      "patient"
    );

    return res.status(200).json(generic);
  } catch (error) {
    console.error("Patient forgotPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Reset password via token
// @route   POST /api/patients/auth/reset-password
// @access  Public
// ───────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const err = handleValidationErrors(req, res);
  if (err) return;

  try {
    const { token, newPassword } = req.body;

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const patient = await Patient.findById(decoded.id).select("+tokenVersion");
    if (!patient) {
      return res.status(400).json({ success: false, message: "Invalid reset token." });
    }

    patient.password = newPassword;
    patient.tokenVersion += 1;
    await patient.save();

    return res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    console.error("Patient resetPassword error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/patients/auth/change-password
// @access  Private (patient)
// ───────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const err = handleValidationErrors(req, res);
  if (err) return;

  try {
    const { currentPassword, newPassword } = req.body;
    const patient = await Patient.findById(req.user._id)
      .select("+password +tokenVersion");

    const isMatch = await patient.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    patient.password = newPassword;
    patient.tokenVersion += 1;
    await patient.save();

    const newToken = generateToken({
      id:           patient._id,
      patientId:    patient.patientId,
      role:         "patient",
      tokenVersion: patient.tokenVersion,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      token: newToken,
    });
  } catch (error) {
    console.error("Patient changePassword error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Admin gets all patients
// @route   GET /api/patients/auth/all
// @access  Private (admin)
// ───────────────────────────────────────────────────────────────
const getAllPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await Patient.countDocuments();
    const patients = await Patient.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: patients.map(sanitize),
    });
  } catch (error) {
    console.error("getAllPatients error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getAllPatients,
};