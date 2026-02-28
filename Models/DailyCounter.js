const mongoose = require('mongoose');

/**
 * DailyCounter
 * Tracks the per-doctor, per-day appointment counter.
 * One document per (doctorId + date) pair.
 *
 * - counter   : the LAST issued appointment number for the day (1-based)
 * - maxPerDay : cap (default 50) — configurable per doctor
 *
 * The compound unique index on (doctorId + date) guarantees atomic
 * findOneAndUpdate increments are race-condition-safe.
 */
const dailyCounterSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: String,   // YYYY-MM-DD
        required: true
    },
    counter: {
        type: Number,
        default: 0      // 0 means no appointments issued yet today
    },
    maxPerDay: {
        type: Number,
        default: 50
    }
}, {
    timestamps: true
});

// Compound unique index: one counter document per doctor per day
dailyCounterSchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCounter', dailyCounterSchema);
