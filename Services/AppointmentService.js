const Appointment = require('../Models/Appointment');
const DoctorSchedule = require('../Models/DoctorSchedule');

class AppointmentService {

    async createAppointment(data) {
        // validate slot existence and working hours (could be done by reusing ScheduleService or direct check)
        const schedule = await DoctorSchedule.findOne({ doctorId: data.doctorId });
        if (!schedule) throw new Error('Doctor schedule not found');

        // Check availability (DB unique index will handle race conditions, but logical check is good)
        // Ensure startTime aligns with slots? (Optional strict check)

        const appointment = new Appointment({
            ...data,
            slotKey: `${data.doctorId}|${data.date}|${data.startTime}`
        });

        try {
            return await appointment.save();
        } catch (err) {
            if (err.code === 11000) {
                throw new Error('Slot already booked'); // Custom error to be caught by controller
            }
            throw err;
        }
    }

    async getAppointments(query) {
        return await Appointment.find(query);
    }

    async updateStatus(id, status, role) {
        const appointment = await Appointment.findById(id);
        if (!appointment) throw new Error('Appointment not found');

        // Add role-based state transition logic here if needed
        appointment.status = status;
        return await appointment.save();
    }
}

module.exports = new AppointmentService();
