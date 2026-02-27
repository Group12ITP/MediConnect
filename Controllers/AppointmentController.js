const AppointmentService = require('../Services/AppointmentService');
const Appointment = require('../Models/Appointment');
const { generateICS } = require('../Utils/icsUtil');
const { success, error } = require('../Utils/response');

exports.createAppointment = async (req, res, next) => {
    try {
        // Add patientId from auth user if not provided (security)
        if (req.user.role === 'PATIENT' || req.user.role === 'patient') {
            req.body.patientId = req.user.id;
        }

        const appointment = await AppointmentService.createAppointment(req.body);

        return success(res, 'appointment.created', appointment, 201);
    } catch (err) {
        if (err.message === 'Slot already booked') {
            return error(res, 'appointment.slot_already_booked', 409);
        }
        next(err);
    }
};

exports.getAppointments = async (req, res, next) => {
    try {
        let query = {};

        if (req.user.role === 'PATIENT' || req.user.role === 'patient') {
            query.patientId = req.user.id;
        } else if (req.user.role === 'DOCTOR' || req.user.role === 'NURSE') {
            if (req.query.doctorId) query.doctorId = req.query.doctorId;
            if (req.query.date) query.date = req.query.date;
        }

        const appointments = await AppointmentService.getAppointments(query);

        res.status(200).json({
            ok: true,
            message: res.__('common.success'),
            count: appointments.length,
            data: appointments,
            locale: req.locale
        });
    } catch (err) {
        next(err);
    }
};

exports.getAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return error(res, 'appointment.not_found', 404);
        }

        // Ownership check
        if (req.user.role === 'PATIENT' && appointment.patientId.toString() !== req.user.id) {
            return error(res, 'auth.forbidden', 403);
        }

        return success(res, 'common.success', appointment);
    } catch (err) {
        next(err);
    }
};

exports.updateAppointment = async (req, res, next) => {
    try {
        let appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return error(res, 'appointment.not_found', 404);
        }

        // Authorization logic for updates
        if (req.user.role === 'PATIENT') {
            if (appointment.patientId.toString() !== req.user.id) {
                return error(res, 'auth.forbidden', 403);
            }
            if (req.body.status === 'CANCELLED') {
                // Check cancellation cutoff time policy here
            }
        }

        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        return success(res, 'appointment.updated', appointment);
    } catch (err) {
        next(err);
    }
};

exports.downloadICS = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return error(res, 'appointment.not_found', 404);
        }

        const icsContent = generateICS(appointment);

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename=appointment-${appointment._id}.ics`);
        res.send(icsContent);
    } catch (err) {
        next(err);
    }
};
