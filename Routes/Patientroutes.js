const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateMe,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  getAllPatients,
} = require("../Controllers/Patientauthcontroller");

const { protect, restrictTo } = require("../Middleware/pharmacistauthmiddleware");
const {
  patientRegisterValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updatePatientValidation,
} = require("../Middleware/pharmacistvalidators");

// ── Public ───────────────────────────────────────────────────────
router.post("/register",        patientRegisterValidation, register);
router.post("/login",           loginValidation,           login);
router.post("/forgot-password", forgotPasswordValidation,  forgotPassword);
router.post("/reset-password",  resetPasswordValidation,   resetPassword);

// ── Private (patient) ────────────────────────────────────────────
router.get( "/me",              protect,                              getMe);
router.put( "/me",              protect, updatePatientValidation,     updateMe);
router.post("/logout-all",      protect,                              logoutAll);
router.put( "/change-password", protect, changePasswordValidation,    changePassword);

// ── Admin only ───────────────────────────────────────────────────
router.get("/all", protect, restrictTo("admin"), getAllPatients);

module.exports = router;