const ScheduleService = require('../Services/ScheduleService');
const DoctorSchedule = require('../Models/DoctorSchedule');

exports.getDoctorSlots = async (req, res, next) => {
    try {
        const { date } = req.query;
        const { doctorId } = req.params;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter is required' });
        }

        const slots = await ScheduleService.getDoctorSlots(doctorId, date);

        res.status(200).json({
            success: true,
            count: slots.length,
            data: slots
        });
    } catch (err) {
        next(err);
    }
};

exports.getDoctorSchedule = async (req, res, next) => {
    try {
        const schedule = await DoctorSchedule.findOne({ doctorId: req.params.doctorId });

        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule not found' });
        }

        res.status(200).json({
            success: true,
            data: schedule
        });
    } catch (err) {
        next(err);
    }
};

exports.createDoctorSchedule = async (req, res, next) => { // Helper for setup
    try {
        const schedule = await DoctorSchedule.create(req.body);
        res.status(201).json({ success: true, data: schedule });
    } catch (err) {
        next(err);
    }
};
