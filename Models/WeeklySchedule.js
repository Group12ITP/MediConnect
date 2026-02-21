const mongoose = require("mongoose");

// ── Sub-schema: A single time slot within a day ─────────────────
const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format (24hr)"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format (24hr)"],
    },
    slotDurationMins: {
      type: Number,
      required: [true, "Slot duration is required"],
      enum: {
        values: [15, 30, 45, 60, 90],
        message: "Slot duration must be 15, 30, 45, 60, or 90 minutes",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// ── Sub-schema: A day entry in the weekly schedule ──────────────
const weeklyDaySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0, // 0 = Sunday
      max: 6, // 6 = Saturday
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    slots: {
      type: [timeSlotSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "Cannot define more than 10 time slots per day",
      },
    },
  },
  { _id: true }
);

// ── Main Weekly Schedule Schema ─────────────────────────────────
const weeklyScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true, // One weekly schedule per doctor
    },
    doctorId: {
      type: String,
      required: true,
      index: true,
    },
    schedule: {
      type: [weeklyDaySchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 7,
        message: "Schedule cannot have more than 7 days",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

weeklyScheduleSchema.index({ doctorId: 1 });

module.exports = mongoose.model("WeeklySchedule", weeklyScheduleSchema);