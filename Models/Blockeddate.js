const mongoose = require("mongoose");

const blockedDateSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },

    // ── Date Range ─────────────────────────────────────────────
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    // ── Reason ─────────────────────────────────────────────────
    reason: {
      type: String,
      trim: true,
      maxlength: [300, "Reason cannot exceed 300 characters"],
      default: "Unavailable",
    },

    // ── Type ───────────────────────────────────────────────────
    blockType: {
      type: String,
      enum: ["vacation", "leave", "personal", "conference", "other"],
      default: "other",
    },
  },
  { timestamps: true }
);

blockedDateSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("BlockedDate", blockedDateSchema);