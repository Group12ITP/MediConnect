const { body, param, query } = require("express-validator");

const VALID_DURATIONS = [15, 30, 45, 60, 90];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

// ── Weekly Schedule Validation ──────────────────────────────────
const weeklyScheduleValidation = [
  body("schedule")
    .isArray({ min: 1, max: 7 })
    .withMessage("Schedule must be an array of 1 to 7 day entries"),

  body("schedule.*.dayOfWeek")
    .isInt({ min: 0, max: 6 })
    .withMessage("dayOfWeek must be 0 (Sunday) to 6 (Saturday)"),

  body("schedule.*.isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be true or false"),

  body("schedule.*.slots")
    .optional()
    .isArray({ max: 10 })
    .withMessage("slots must be an array of up to 10 entries"),

  body("schedule.*.slots.*.startTime")
    .matches(TIME_REGEX)
    .withMessage("startTime must be in HH:MM (24hr) format"),

  body("schedule.*.slots.*.endTime")
    .matches(TIME_REGEX)
    .withMessage("endTime must be in HH:MM (24hr) format"),

  body("schedule.*.slots.*.slotDurationMins")
    .isIn(VALID_DURATIONS)
    .withMessage(`slotDurationMins must be one of: ${VALID_DURATIONS.join(", ")}`),
];

// ── Date Slot Validation ────────────────────────────────────────
const dateSlotValidation = [
  body("date")
    .notEmpty().withMessage("Date is required")
    .isISO8601().withMessage("Date must be a valid ISO 8601 date (e.g. 2026-03-15)")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error("Date cannot be in the past");
      return true;
    }),

  body("startTime")
    .notEmpty().withMessage("Start time is required")
    .matches(TIME_REGEX).withMessage("startTime must be HH:MM (24hr) format"),

  body("endTime")
    .notEmpty().withMessage("End time is required")
    .matches(TIME_REGEX).withMessage("endTime must be HH:MM (24hr) format")
    .custom((endTime, { req }) => {
      const start = req.body.startTime;
      if (start && endTime <= start) {
        throw new Error("endTime must be after startTime");
      }
      return true;
    }),

  body("slotDurationMins")
    .notEmpty().withMessage("Slot duration is required")
    .isIn(VALID_DURATIONS)
    .withMessage(`slotDurationMins must be one of: ${VALID_DURATIONS.join(", ")}`),
];

// ── Bulk Date Slots Validation ──────────────────────────────────
const bulkDateSlotsValidation = [
  body("slots")
    .isArray({ min: 1, max: 50 })
    .withMessage("slots must be an array of 1 to 50 entries"),

  body("slots.*.date")
    .notEmpty().withMessage("Each slot must have a date")
    .isISO8601().withMessage("Each date must be ISO 8601 format")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error("Dates cannot be in the past");
      return true;
    }),

  body("slots.*.startTime")
    .matches(TIME_REGEX).withMessage("Each startTime must be HH:MM (24hr)"),

  body("slots.*.endTime")
    .matches(TIME_REGEX).withMessage("Each endTime must be HH:MM (24hr)"),

  body("slots.*.slotDurationMins")
    .isIn(VALID_DURATIONS)
    .withMessage(`Each slotDurationMins must be one of: ${VALID_DURATIONS.join(", ")}`),
];

// ── Blocked Date Validation ─────────────────────────────────────
const blockedDateValidation = [
  body("startDate")
    .notEmpty().withMessage("Start date is required")
    .isISO8601().withMessage("Start date must be ISO 8601 format")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error("Start date cannot be in the past");
      return true;
    }),

  body("endDate")
    .notEmpty().withMessage("End date is required")
    .isISO8601().withMessage("End date must be ISO 8601 format")
    .custom((endDate, { req }) => {
      const start = new Date(req.body.startDate);
      const end = new Date(endDate);
      if (end < start) throw new Error("End date must be on or after start date");
      return true;
    }),

  body("reason")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Reason cannot exceed 300 characters"),

  body("blockType")
    .optional()
    .isIn(["vacation", "leave", "personal", "conference", "other"])
    .withMessage("blockType must be: vacation, leave, personal, conference, or other"),
];

// ── Query Validation for availability lookup ────────────────────
const availabilityQueryValidation = [
  query("date")
    .optional()
    .isISO8601()
    .withMessage("date query param must be ISO 8601 format"),

  query("doctorId")
    .optional()
    .matches(/^DOC-\d+$/)
    .withMessage("doctorId must be in DOC-001 format"),
];

// ── Slot ID param validation ────────────────────────────────────
const slotIdValidation = [
  param("slotId")
    .notEmpty().withMessage("Slot ID is required")
    .isMongoId().withMessage("Invalid slot ID format"),
];

const blockedDateIdValidation = [
  param("blockId")
    .notEmpty().withMessage("Block ID is required")
    .isMongoId().withMessage("Invalid block ID format"),
];

module.exports = {
  weeklyScheduleValidation,
  dateSlotValidation,
  bulkDateSlotsValidation,
  blockedDateValidation,
  availabilityQueryValidation,
  slotIdValidation,
  blockedDateIdValidation,
};