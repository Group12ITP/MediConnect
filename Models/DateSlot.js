const mongoose = require("mongoose");

const dateSlotSchema = new mongoose.Schema(
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

    // ── Date & Time ───────────────────────────────────────────
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be HH:MM (24hr)"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be HH:MM (24hr)"],
    },
    slotDurationMins: {
      type: Number,
      required: [true, "Slot duration is required"],
      enum: {
        values: [15, 30, 45, 60, 90],
        message: "Slot duration must be 15, 30, 45, 60, or 90 minutes",
      },
    },

    // ── Slot Status ───────────────────────────────────────────
    status: {
      type: String,
      enum: ["available", "booked", "blocked"],
      default: "available",
    },

    // ── Booking Reference ─────────────────────────────────────
    // Populated when an appointment is made against this slot
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // ── Block Reason (for vacation/leave slots) ────────────────
    blockReason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// ── Compound indexes for fast queries ──────────────────────────
dateSlotSchema.index({ doctorId: 1, date: 1 });
dateSlotSchema.index({ doctorId: 1, date: 1, status: 1 });
dateSlotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true }); // prevent duplicate slots

module.exports = mongoose.model("DateSlot", dateSlotSchema);