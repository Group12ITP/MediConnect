const mongoose = require("mongoose");

const dateSlotSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    doctorId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"] },
    endTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"] },
    slotDurationMins: { type: Number, required: true, enum: [15, 30, 45, 60, 90] },
    status: { type: String, enum: ["available", "booked", "blocked"], default: "available" },
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", default: null },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    blockReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

dateSlotSchema.index({ doctorId: 1, date: 1 });
dateSlotSchema.index({ doctorId: 1, date: 1, status: 1 });
dateSlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

// FIX: Check if model exists before creating
const DateSlot = mongoose.models.DateSlot || mongoose.model("DateSlot", dateSlotSchema);

module.exports = DateSlot;