const mongoose = require("mongoose");

const blockedDateSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorId: { type: String, required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, maxlength: 300, default: "Unavailable" },
    blockType: { type: String, enum: ["vacation", "leave", "personal", "conference", "other"], default: "other" },
  },
  { timestamps: true }
);

blockedDateSchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

// FIX: Check if model exists before creating
const BlockedDate = mongoose.models.BlockedDate || mongoose.model("BlockedDate", blockedDateSchema);

module.exports = BlockedDate;