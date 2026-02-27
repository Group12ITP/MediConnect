const Appointment = require('../Models/Appointment');
const DoctorSchedule = require('../Models/DoctorSchedule');
const DailyCounter = require('../Models/DailyCounter');

/**
 * Get today's date in YYYY-MM-DD (Sri Lanka timezone UTC+5:30)
 * Used when no explicit date is passed.
 */
function todayLK() {
    const now = new Date();
    // Offset to UTC+5:30
    const lk = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return lk.toISOString().slice(0, 10);
}

class AppointmentService {

    /**
     * Create an appointment with a daily sequential number (1–50).
     *
     * Algorithm:
     * 1. findOneAndUpdate the DailyCounter for (doctorId + date) atomically:
     *    - If the doc doesn't exist yet, upsert with counter = 1  → appointmentNo = 1
     *    - If it exists and counter < maxPerDay, increment by 1    → appointmentNo = new value
     *    - If counter already == maxPerDay, do NOT increment — detect this and throw
     * 2. Save the Appointment with queueToken = appointmentNo.
     *
     * The unique compound index on DailyCounter (doctorId + date) means every new
     * calendar day automatically starts fresh — NO cron job required.
     */
    async createAppointment(data) {
        const schedule = await DoctorSchedule.findOne({ doctorId: data.doctorId });
        if (!schedule) throw new Error('Doctor schedule not found');

        const date = data.date || todayLK();

        // ─── Atomically claim the next appointment number ──────────────────────
        // We first fetch the current counter to check the cap BEFORE incrementing
        const existing = await DailyCounter.findOne({ doctorId: data.doctorId, date });

        const MAX = (existing && existing.maxPerDay) ? existing.maxPerDay : 50;

        if (existing && existing.counter >= MAX) {
            throw new Error('Daily appointment limit reached');
        }

        // Atomic increment — safe against race conditions
        const counter = await DailyCounter.findOneAndUpdate(
            {
                doctorId: data.doctorId,
                date,
                // Only increment if still under the cap
                $or: [{ counter: { $lt: MAX } }, { counter: { $exists: false } }]
            },
            { $inc: { counter: 1 } },
            {
                upsert: true,           // create doc for the new day if it doesn't exist
                new: true,             // return the updated document
                setDefaultsOnInsert: true
            }
        );

        if (!counter) {
            throw new Error('Daily appointment limit reached');
        }

        const appointmentNo = counter.counter;

        // ─── Save Appointment ──────────────────────────────────────────────────
        const appointment = new Appointment({
            ...data,
            date,
            queueToken: appointmentNo,
            slotKey: `${data.doctorId}|${date}|${data.startTime}`
        });

        try {
            return await appointment.save();
        } catch (err) {
            if (err.code === 11000) {
                // Slot time already taken — roll back the counter
                await DailyCounter.findOneAndUpdate(
                    { doctorId: data.doctorId, date },
                    { $inc: { counter: -1 } }
                );
                throw new Error('Slot already booked');
            }
            throw err;
        }
    }

    async getAppointments(query) {
        return await Appointment.find(query).sort({ date: 1, queueToken: 1 });
    }

    async updateStatus(id, status) {
        const appointment = await Appointment.findById(id);
        if (!appointment) throw new Error('Appointment not found');
        appointment.status = status;
        return await appointment.save();
    }

    /**
     * Get today's counter status for a doctor — useful for the UI
     * to show "X of 50 slots used today".
     */
    async getDailyCounter(doctorId, date) {
        const d = date || todayLK();
        const counter = await DailyCounter.findOne({ doctorId, date: d });
        const max = (counter && counter.maxPerDay) ? counter.maxPerDay : 50;
        const used = (counter && counter.counter) ? counter.counter : 0;
        return {
            date: d,
            doctorId,
            used,
            remaining: max - used,
            max,
            isFull: used >= max
        };
    }
}

module.exports = new AppointmentService();
