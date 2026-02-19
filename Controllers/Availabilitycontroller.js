const { validationResult } = require("express-validator");
const WeeklySchedule = require("../Models/WeeklySchedule");
const DateSlot = require("../Models/DateSlot");
const BlockedDate = require("../Models/Blockeddate");

// ── Helper: Format validation errors ───────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ── Helper: Convert "HH:MM" to total minutes ────────────────────
const toMinutes = (time) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// ── Helper: Check if a date falls within any blocked range ──────
const isDateBlocked = async (doctorId, date) => {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  const block = await BlockedDate.findOne({
    doctorId,
    startDate: { $lte: checkDate },
    endDate: { $gte: checkDate },
  });

  return !!block;
};

// ── Helper: Generate individual time slots from a range ─────────
// e.g. 09:00 to 12:00 with 30min duration → ["09:00","09:30","10:00"...]
const generateTimeSlots = (startTime, endTime, durationMins) => {
  const slots = [];
  let current = toMinutes(startTime);
  const end = toMinutes(endTime);

  while (current + durationMins <= end) {
    const h = String(Math.floor(current / 60)).padStart(2, "0");
    const m = String(current % 60).padStart(2, "0");
    const slotEnd = current + durationMins;
    const hEnd = String(Math.floor(slotEnd / 60)).padStart(2, "0");
    const mEnd = String(slotEnd % 60).padStart(2, "0");
    slots.push({ startTime: `${h}:${m}`, endTime: `${hEnd}:${mEnd}` });
    current += durationMins;
  }

  return slots;
};

// ═══════════════════════════════════════════════════════════════
//  WEEKLY SCHEDULE
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// @desc    Create or replace the weekly recurring schedule
// @route   POST /api/doctors/availability/weekly
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const setWeeklySchedule = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { schedule } = req.body;

    // Validate: endTime must be after startTime in each slot
    for (const day of schedule) {
      for (const slot of day.slots || []) {
        if (toMinutes(slot.endTime) <= toMinutes(slot.startTime)) {
          return res.status(422).json({
            success: false,
            message: `Day ${day.dayOfWeek}: endTime must be after startTime in all slots`,
          });
        }
        // Ensure slot duration fits within the time range
        const rangeMins = toMinutes(slot.endTime) - toMinutes(slot.startTime);
        if (slot.slotDurationMins > rangeMins) {
          return res.status(422).json({
            success: false,
            message: `Day ${day.dayOfWeek}: slot duration (${slot.slotDurationMins}min) exceeds the time range`,
          });
        }
      }
    }

    // Upsert — create if not exists, replace if exists
    const weeklySchedule = await WeeklySchedule.findOneAndUpdate(
      { doctor: req.doctor._id },
      {
        doctor: req.doctor._id,
        doctorId: req.doctor.doctorId,
        schedule,
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Weekly schedule saved successfully.",
      data: weeklySchedule,
    });
  } catch (error) {
    console.error("setWeeklySchedule error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get own weekly schedule
// @route   GET /api/doctors/availability/weekly/me
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const getMyWeeklySchedule = async (req, res) => {
  try {
    const schedule = await WeeklySchedule.findOne({ doctor: req.doctor._id });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "No weekly schedule found. Please set your schedule first.",
      });
    }

    return res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error("getMyWeeklySchedule error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get a doctor's weekly schedule by doctorId (public-ish)
// @route   GET /api/doctors/availability/weekly/:doctorId
// @access  Private (doctor, admin)
// ───────────────────────────────────────────────────────────────
const getWeeklyScheduleByDoctorId = async (req, res) => {
  try {
    const schedule = await WeeklySchedule.findOne({
      doctorId: req.params.doctorId,
      isActive: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: `No active weekly schedule found for ${req.params.doctorId}`,
      });
    }

    return res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error("getWeeklyScheduleByDoctorId error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Toggle weekly schedule active/inactive
// @route   PATCH /api/doctors/availability/weekly/toggle
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const toggleWeeklySchedule = async (req, res) => {
  try {
    const schedule = await WeeklySchedule.findOne({ doctor: req.doctor._id });

    if (!schedule) {
      return res.status(404).json({ success: false, message: "No weekly schedule found." });
    }

    schedule.isActive = !schedule.isActive;
    await schedule.save();

    return res.status(200).json({
      success: true,
      message: `Weekly schedule is now ${schedule.isActive ? "active" : "inactive"}.`,
      data: { isActive: schedule.isActive },
    });
  } catch (error) {
    console.error("toggleWeeklySchedule error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  SPECIFIC DATE SLOTS
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// @desc    Add a single specific date slot
// @route   POST /api/doctors/availability/slots
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const addDateSlot = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { date, startTime, endTime, slotDurationMins } = req.body;

    // Check if date is blocked
    const blocked = await isDateBlocked(req.doctor.doctorId, date);
    if (blocked) {
      return res.status(409).json({
        success: false,
        message: "This date is blocked. Please unblock the date first.",
      });
    }

    // Check for duplicate slot
    const existing = await DateSlot.findOne({
      doctor: req.doctor._id,
      date: new Date(date),
      startTime,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A slot at ${startTime} on this date already exists.`,
      });
    }

    const slot = await DateSlot.create({
      doctor: req.doctor._id,
      doctorId: req.doctor.doctorId,
      date: new Date(date),
      startTime,
      endTime,
      slotDurationMins,
      status: "available",
    });

    return res.status(201).json({
      success: true,
      message: "Slot added successfully.",
      data: slot,
    });
  } catch (error) {
    console.error("addDateSlot error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Bulk add date slots (e.g. generate all slots for a day)
// @route   POST /api/doctors/availability/slots/bulk
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const addBulkDateSlots = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { slots } = req.body;
    const created = [];
    const skipped = [];

    for (const slotData of slots) {
      const { date, startTime, endTime, slotDurationMins } = slotData;

      // Skip blocked dates
      const blocked = await isDateBlocked(req.doctor.doctorId, date);
      if (blocked) {
        skipped.push({ date, reason: "Date is blocked" });
        continue;
      }

      // Generate individual sub-slots within the time range
      const subSlots = generateTimeSlots(startTime, endTime, slotDurationMins);

      for (const sub of subSlots) {
        const existing = await DateSlot.findOne({
          doctor: req.doctor._id,
          date: new Date(date),
          startTime: sub.startTime,
        });

        if (!existing) {
          created.push({
            doctor: req.doctor._id,
            doctorId: req.doctor.doctorId,
            date: new Date(date),
            startTime: sub.startTime,
            endTime: sub.endTime,
            slotDurationMins,
            status: "available",
          });
        } else {
          skipped.push({ date, startTime: sub.startTime, reason: "Already exists" });
        }
      }
    }

    const insertedSlots = created.length > 0 ? await DateSlot.insertMany(created) : [];

    return res.status(201).json({
      success: true,
      message: `${insertedSlots.length} slot(s) created. ${skipped.length} skipped.`,
      data: { created: insertedSlots.length, skipped },
    });
  } catch (error) {
    console.error("addBulkDateSlots error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get own slots (optionally filtered by date)
// @route   GET /api/doctors/availability/slots/me?date=2026-03-15&status=available
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const getMySlots = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20 } = req.query;
    const filter = { doctor: req.doctor._id };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await DateSlot.countDocuments(filter);

    const slots = await DateSlot.find(filter)
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      data: slots,
    });
  } catch (error) {
    console.error("getMySlots error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get available slots for a doctor by doctorId and date
// @route   GET /api/doctors/availability/slots/:doctorId?date=2026-03-15
// @access  Private (doctor, admin)
// ───────────────────────────────────────────────────────────────
const getAvailableSlotsByDoctorId = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    const filter = { doctorId, status: "available" };

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else {
      // Default: only future slots
      filter.date = { $gte: new Date() };
    }

    const slots = await DateSlot.find(filter).sort({ date: 1, startTime: 1 });

    return res.status(200).json({
      success: true,
      total: slots.length,
      data: slots,
    });
  } catch (error) {
    console.error("getAvailableSlotsByDoctorId error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Mark a slot as booked (called by appointment service)
// @route   PATCH /api/doctors/availability/slots/:slotId/book
// @access  Private (doctor, admin)
// ───────────────────────────────────────────────────────────────
const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { bookedBy, appointmentId } = req.body;

    const slot = await DateSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found." });
    }

    if (slot.status !== "available") {
      return res.status(409).json({
        success: false,
        message: `Slot is already ${slot.status} and cannot be booked.`,
      });
    }

    slot.status = "booked";
    slot.bookedBy = bookedBy || null;
    slot.appointmentId = appointmentId || null;
    await slot.save();

    return res.status(200).json({
      success: true,
      message: "Slot marked as booked.",
      data: slot,
    });
  } catch (error) {
    console.error("bookSlot error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Release a booked slot back to available (appointment cancelled)
// @route   PATCH /api/doctors/availability/slots/:slotId/release
// @access  Private (doctor, admin)
// ───────────────────────────────────────────────────────────────
const releaseSlot = async (req, res) => {
  try {
    const slot = await DateSlot.findById(req.params.slotId);

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found." });
    }

    if (slot.status !== "booked") {
      return res.status(400).json({
        success: false,
        message: "Only booked slots can be released.",
      });
    }

    slot.status = "available";
    slot.bookedBy = null;
    slot.appointmentId = null;
    await slot.save();

    return res.status(200).json({
      success: true,
      message: "Slot released back to available.",
      data: slot,
    });
  } catch (error) {
    console.error("releaseSlot error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Delete a specific slot (only if available)
// @route   DELETE /api/doctors/availability/slots/:slotId
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const deleteDateSlot = async (req, res) => {
  try {
    const slot = await DateSlot.findOne({
      _id: req.params.slotId,
      doctor: req.doctor._id,
    });

    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found." });
    }

    if (slot.status === "booked") {
      return res.status(409).json({
        success: false,
        message: "Cannot delete a booked slot. Cancel the appointment first.",
      });
    }

    await slot.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Slot deleted successfully.",
    });
  } catch (error) {
    console.error("deleteDateSlot error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  BLOCKED DATES (Vacation / Leave)
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// @desc    Block a date range (vacation, leave, etc.)
// @route   POST /api/doctors/availability/blocked
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const blockDates = async (req, res) => {
  const validationError = handleValidationErrors(req, res);
  if (validationError) return;

  try {
    const { startDate, endDate, reason, blockType } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Check for existing overlapping blocks
    const overlap = await BlockedDate.findOne({
      doctorId: req.doctor.doctorId,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } },
      ],
    });

    if (overlap) {
      return res.status(409).json({
        success: false,
        message: "This date range overlaps with an existing blocked period.",
      });
    }

    const block = await BlockedDate.create({
      doctor: req.doctor._id,
      doctorId: req.doctor.doctorId,
      startDate: start,
      endDate: end,
      reason: reason || "Unavailable",
      blockType: blockType || "other",
    });

    return res.status(201).json({
      success: true,
      message: "Date range blocked successfully.",
      data: block,
    });
  } catch (error) {
    console.error("blockDates error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Get all blocked dates for own account
// @route   GET /api/doctors/availability/blocked/me
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const getMyBlockedDates = async (req, res) => {
  try {
    const blocks = await BlockedDate.find({
      doctor: req.doctor._id,
      endDate: { $gte: new Date() }, // Only upcoming blocks
    }).sort({ startDate: 1 });

    return res.status(200).json({
      success: true,
      total: blocks.length,
      data: blocks,
    });
  } catch (error) {
    console.error("getMyBlockedDates error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ───────────────────────────────────────────────────────────────
// @desc    Delete a blocked date range (unblock)
// @route   DELETE /api/doctors/availability/blocked/:blockId
// @access  Private (doctor)
// ───────────────────────────────────────────────────────────────
const unblockDates = async (req, res) => {
  try {
    const block = await BlockedDate.findOne({
      _id: req.params.blockId,
      doctor: req.doctor._id,
    });

    if (!block) {
      return res.status(404).json({ success: false, message: "Blocked date not found." });
    }

    await block.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Date range unblocked successfully.",
    });
  } catch (error) {
    console.error("unblockDates error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ═══════════════════════════════════════════════════════════════
//  COMBINED AVAILABILITY VIEW
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// @desc    Get a doctor's full availability for a specific date
//          (Checks weekly schedule + specific slots + blocked dates)
// @route   GET /api/doctors/availability/:doctorId/date/:date
// @access  Private (doctor, admin)
// ───────────────────────────────────────────────────────────────
const getAvailabilityForDate = async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // 1. Check if date is blocked
    const blocked = await BlockedDate.findOne({
      doctorId,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
    });

    if (blocked) {
      return res.status(200).json({
        success: true,
        isBlocked: true,
        blockReason: blocked.reason,
        blockType: blocked.blockType,
        availableSlots: [],
      });
    }

    // 2. Get specific date slots
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dateSlots = await DateSlot.find({
      doctorId,
      date: { $gte: start, $lte: end },
      status: "available",
    }).sort({ startTime: 1 });

    // 3. Get weekly schedule for this day of week
    const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat
    const weeklySchedule = await WeeklySchedule.findOne({
      doctorId,
      isActive: true,
      "schedule.dayOfWeek": dayOfWeek,
      "schedule.isAvailable": true,
    });

    let weeklySlots = [];
    if (weeklySchedule) {
      const dayEntry = weeklySchedule.schedule.find(
        (d) => d.dayOfWeek === dayOfWeek && d.isAvailable
      );
      if (dayEntry) {
        for (const slot of dayEntry.slots) {
          if (slot.isActive) {
            const subSlots = generateTimeSlots(
              slot.startTime,
              slot.endTime,
              slot.slotDurationMins
            );
            weeklySlots.push(...subSlots.map((s) => ({ ...s, source: "weekly" })));
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      isBlocked: false,
      date,
      doctorId,
      specificSlots: dateSlots,
      weeklySlots,
      totalAvailable: dateSlots.length + weeklySlots.length,
    });
  } catch (error) {
    console.error("getAvailabilityForDate error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  // Weekly schedule
  setWeeklySchedule,
  getMyWeeklySchedule,
  getWeeklyScheduleByDoctorId,
  toggleWeeklySchedule,
  // Date slots
  addDateSlot,
  addBulkDateSlots,
  getMySlots,
  getAvailableSlotsByDoctorId,
  bookSlot,
  releaseSlot,
  deleteDateSlot,
  // Blocked dates
  blockDates,
  getMyBlockedDates,
  unblockDates,
  // Combined view
  getAvailabilityForDate,
};