const express = require("express");
const router = express.Router();

const {
  setWeeklySchedule,
  getMyWeeklySchedule,
  getWeeklyScheduleByDoctorId,
  toggleWeeklySchedule,
  addDateSlot,
  addBulkDateSlots,
  getMySlots,
  getAvailableSlotsByDoctorId,
  bookSlot,
  releaseSlot,
  deleteDateSlot,
  blockDates,
  getMyBlockedDates,
  unblockDates,
  getAvailabilityForDate,
} = require("../Controllers/Availabilitycontroller");

const { protect, restrictTo, requireApproved } = require("../Middleware/authMiddleware");
const {
  weeklyScheduleValidation,
  dateSlotValidation,
  bulkDateSlotsValidation,
  blockedDateValidation,
  slotIdValidation,
  blockedDateIdValidation,
} = require("../Middleware/validation/Availabilityvalidators");

// ── All routes require authentication ───────────────────────────
router.use(protect, requireApproved);

// ── Weekly Schedule ─────────────────────────────────────────────
router.post("/weekly", weeklyScheduleValidation, setWeeklySchedule);
router.get("/weekly/me", getMyWeeklySchedule);
router.patch("/weekly/toggle", toggleWeeklySchedule);
router.get("/weekly/:doctorId", getWeeklyScheduleByDoctorId);

// ── Specific Date Slots ─────────────────────────────────────────
router.post("/slots", dateSlotValidation, addDateSlot);
router.post("/slots/bulk", bulkDateSlotsValidation, addBulkDateSlots);
router.get("/slots/me", getMySlots);
router.get("/slots/:doctorId", getAvailableSlotsByDoctorId);
router.patch("/slots/:slotId/book", slotIdValidation, bookSlot);
router.patch("/slots/:slotId/release", slotIdValidation, releaseSlot);
router.delete("/slots/:slotId", slotIdValidation, deleteDateSlot);

// ── Blocked Dates ───────────────────────────────────────────────
router.post("/blocked", blockedDateValidation, blockDates);
router.get("/blocked/me", getMyBlockedDates);
router.delete("/blocked/:blockId", blockedDateIdValidation, unblockDates);

// ── Combined Availability View ──────────────────────────────────
// Most useful endpoint for the frontend — checks everything at once
router.get("/:doctorId/date/:date", getAvailabilityForDate);

module.exports = router;