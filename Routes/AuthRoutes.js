const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  approveDoctor,
} = require("../Controllers/AuthController");

const { protect, restrictTo, requireApproved } = require("../Middleware/Authmiddleware");

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} = require("../Middleware/Validators");

// ── Public Routes ───────────────────────────────────────────────
router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/forgot-password", forgotPasswordValidation, forgotPassword);
router.post("/reset-password", resetPasswordValidation, resetPassword);

// ── Private Routes (any authenticated doctor/admin) ─────────────
router.get("/me", protect, requireApproved, getMe);
router.post("/logout-all", protect, logoutAll);
router.put("/change-password", protect, requireApproved, changePasswordValidation, changePassword);

// ── Admin Only Routes ───────────────────────────────────────────
router.patch("/approve/:id", protect, restrictTo("admin"), approveDoctor);

module.exports = router;