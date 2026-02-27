const express = require("express");
const router = express.Router();

const {
  exportMyProfilePDF,
  exportMyProfileExcel,
  exportMyAvailabilityPDF,
  exportMyAvailabilityExcel,
  exportAllDoctorsPDF,
  exportAllDoctorsExcel,
  exportDoctorByIdPDF,
  exportDoctorByIdExcel,
} = require("../Controllers/ExportController");

const { protect, restrictTo, requireApproved } = require("../middleware/authMiddleware");

// ── All routes require authentication ───────────────────────────
router.use(protect, requireApproved);

// ── Doctor: Export own profile ───────────────────────────────────
router.get("/profile/pdf",   exportMyProfilePDF);
router.get("/profile/excel", exportMyProfileExcel);

// ── Doctor: Export own availability ─────────────────────────────
router.get("/availability/pdf",   exportMyAvailabilityPDF);
router.get("/availability/excel", exportMyAvailabilityExcel);

// ── Admin: Export all doctors list ──────────────────────────────
router.get("/all/pdf",   restrictTo("admin"), exportAllDoctorsPDF);
router.get("/all/excel", restrictTo("admin"), exportAllDoctorsExcel);

// ── Admin: Export a specific doctor by doctorId ─────────────────
// Must be defined AFTER /all/* to avoid route conflicts
router.get("/:doctorId/pdf",   restrictTo("admin"), exportDoctorByIdPDF);
router.get("/:doctorId/excel", restrictTo("admin"), exportDoctorByIdExcel);

module.exports = router;