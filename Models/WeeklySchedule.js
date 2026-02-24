const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema({
  startTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"] },
  endTime: { type: String, required: true, match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"] },
  slotDurationMins: { type: Number, required: true, enum: [15, 30, 45, 60, 90] },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const weeklyDaySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
  isAvailable: { type: Boolean, default: true },
  slots: { type: [timeSlotSchema], default: [] },
}, { _id: true });

const weeklyScheduleSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, unique: true },
    doctorId: { type: String, required: true, index: true },
    schedule: { type: [weeklyDaySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

weeklyScheduleSchema.index({ doctorId: 1 });

// FIX: Check if model exists before creating
const WeeklySchedule = mongoose.models.WeeklySchedule || mongoose.model("WeeklySchedule", weeklyScheduleSchema);

module.exports = WeeklySchedule;