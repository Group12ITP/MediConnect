const DoctorSchedule = require('../Models/DoctorSchedule');
const Appointment = require('../Models/Appointment');

class ScheduleService {

    // Helper to generate time slots
    generateSlots(start, end, duration) {
        const slots = [];
        let current = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);

        while (current < endTime) {
            const slotStart = current.toTimeString().slice(0, 5);
            current.setMinutes(current.getMinutes() + duration);
            const slotEnd = current.toTimeString().slice(0, 5);

            if (current <= endTime) {
                slots.push({ startTime: slotStart, endTime: slotEnd });
            }
        }
        return slots;
    }

    async getDoctorSlots(doctorId, date) {
        const schedule = await DoctorSchedule.findOne({ doctorId });
        if (!schedule) throw new Error('Doctor schedule not found');

        // Check if doctor works on this day
        const dateObj = new Date(date);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[dateObj.getDay()];

        if (!schedule.workingDays.includes(dayName)) {
            return []; // Not a working day
        }

        const allSlots = this.generateSlots(schedule.dailyStartTime, schedule.dailyEndTime, schedule.slotDurationMinutes);

        // Get existing appointments to mark unavailable slots
        const appointments = await Appointment.find({
            doctorId,
            date,
            status: { $ne: 'CANCELLED' }
        });

        const bookedTimes = new Set(appointments.map(a => a.startTime));

        return allSlots.map(slot => ({
            ...slot,
            isAvailable: !bookedTimes.has(slot.startTime)
        }));
    }
}

module.exports = new ScheduleService();
