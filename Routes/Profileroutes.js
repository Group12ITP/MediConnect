const express = require("express");
const router = express.Router();

const {
  createProfile,
  getMyProfile,
  getProfileById,
  getAllProfiles,
  updateProfile,
  uploadProfilePhoto,
  deleteProfilePhoto,
  addEducation,
  updateEducation,
  deleteEducation,
  deleteProfile,
} = require("../Controllers/Profilecontroller");

const { protect, restrictTo, requireApproved } = require("../Middleware/Authmiddleware");
const upload = require("../Middleware/upload");
const {
  profileValidation,
  educationValidation,
  educationIdValidation,
} = require("../Middleware/validation/Profilevalidators");

// ── All routes require authentication ───────────────────────────
router.use(protect);

// ── Profile CRUD ────────────────────────────────────────────────

// Doctor creates their own profile
router.post(
  "/",
  requireApproved,
  profileValidation,
  createProfile
);

// Doctor gets their own profile
router.get("/me", requireApproved, getMyProfile);

// Doctor updates their own profile
router.put(
  "/me",
  requireApproved,
  profileValidation,
  updateProfile
);

// ── Photo Upload ────────────────────────────────────────────────

// Doctor uploads/replaces their profile photo
router.patch(
  "/me/photo",
  requireApproved,
  upload.single("profilePhoto"), // field name in form-data
  uploadProfilePhoto
);

// Doctor deletes their profile photo
router.delete("/me/photo", requireApproved, deleteProfilePhoto);

// ── Education Management ────────────────────────────────────────

// Add an education entry
router.post(
  "/me/education",
  requireApproved,
  educationValidation,
  addEducation
);

// Update a specific education entry
router.put(
  "/me/education/:eduId",
  requireApproved,
  [...educationValidation, ...educationIdValidation],
  updateEducation
);

// Delete a specific education entry
router.delete(
  "/me/education/:eduId",
  requireApproved,
  educationIdValidation,
  deleteEducation
);

// ── Admin Routes ────────────────────────────────────────────────

// Admin gets all profiles with filters & pagination
router.get("/", restrictTo("admin"), getAllProfiles);

// Admin or doctor views any profile by doctorId (e.g. DOC-001)
router.get("/:doctorId", requireApproved, getProfileById);

// Admin deletes a doctor profile
router.delete("/:doctorId", restrictTo("admin"), deleteProfile);

module.exports = router;