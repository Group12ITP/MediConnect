const { body, param } = require("express-validator");

// ── Create / Update Profile Validation ─────────────────────────
const profileValidation = [
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Bio cannot exceed 1000 characters"),

  body("yearsOfExperience")
    .optional()
    .isInt({ min: 0, max: 70 })
    .withMessage("Years of experience must be a number between 0 and 70"),

  body("consultationFee.amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Consultation fee must be a positive number"),

  body("consultationFee.currency")
    .optional()
    .trim()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code (e.g. LKR, USD)"),

  body("languages")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Languages must be an array with at most 10 items"),

  body("languages.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each language entry must be a non-empty string"),

  body("affiliation.hospitalName")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Hospital name cannot exceed 200 characters"),

  body("affiliation.address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("Address cannot exceed 300 characters"),

  body("affiliation.city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City cannot exceed 100 characters"),
];

// ── Education Entry Validation ──────────────────────────────────
const educationValidation = [
  body("degree")
    .trim()
    .notEmpty()
    .withMessage("Degree is required")
    .isLength({ max: 150 })
    .withMessage("Degree cannot exceed 150 characters"),

  body("institution")
    .trim()
    .notEmpty()
    .withMessage("Institution is required")
    .isLength({ max: 200 })
    .withMessage("Institution name cannot exceed 200 characters"),

  body("year")
    .notEmpty()
    .withMessage("Graduation year is required")
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage(`Year must be between 1950 and ${new Date().getFullYear()}`),
];

// ── Education ID param validation ───────────────────────────────
const educationIdValidation = [
  param("eduId")
    .notEmpty()
    .withMessage("Education ID is required")
    .isMongoId()
    .withMessage("Invalid education ID format"),
];

module.exports = {
  profileValidation,
  educationValidation,
  educationIdValidation,
};