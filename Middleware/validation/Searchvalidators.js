const { query } = require("express-validator");

const searchValidation = [
  // ── Text Search ───────────────────────────────────────────────
  query("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name search must be between 2 and 100 characters"),

  // ── Specialization ────────────────────────────────────────────
  query("specialization")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Specialization must be between 2 and 100 characters"),

  // ── City ──────────────────────────────────────────────────────
  query("city")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City must be between 2 and 100 characters"),

  // ── Fee Range ─────────────────────────────────────────────────
  query("minFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minFee must be a positive number"),

  query("maxFee")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxFee must be a positive number")
    .custom((maxFee, { req }) => {
      if (req.query.minFee && Number(maxFee) < Number(req.query.minFee)) {
        throw new Error("maxFee must be greater than or equal to minFee");
      }
      return true;
    }),

  // ── Experience ────────────────────────────────────────────────
  query("minExperience")
    .optional()
    .isInt({ min: 0, max: 70 })
    .withMessage("minExperience must be a number between 0 and 70"),

  // ── Availability Date ─────────────────────────────────────────
  query("availableOn")
    .optional()
    .isISO8601()
    .withMessage("availableOn must be a valid date (e.g. 2026-03-15)")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) throw new Error("availableOn cannot be a past date");
      return true;
    }),

  // ── Sorting ───────────────────────────────────────────────────
  query("sortBy")
    .optional()
    .isIn(["fee_asc", "fee_desc", "experience_asc", "experience_desc", "name_asc", "name_desc"])
    .withMessage("sortBy must be: fee_asc, fee_desc, experience_asc, experience_desc, name_asc, or name_desc"),

  // ── Pagination ────────────────────────────────────────────────
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("limit must be between 1 and 50"),
];

module.exports = { searchValidation };