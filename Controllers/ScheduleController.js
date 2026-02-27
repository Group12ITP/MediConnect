const ScheduleService = require('../Services/ScheduleService');
const DoctorSchedule = require('../Models/DoctorSchedule');
const { success, error } = require('../Utils/response');

exports.getDoctorSlots = async (req, res, next) => {
    try {
        const { date } = req.query;
        const { doctorId } = req.params;

        if (!date) {
            return error(res, 'schedule.date_required', 400);
        }

        const slots = await ScheduleService.getDoctorSlots(doctorId, date);

        res.status(200).json({
            ok: true,
            message: res.__('common.success'),
            count: slots.length,
            data: slots,
            locale: req.locale
        });
    } catch (err) {
        next(err);
    }
};

exports.getDoctorSchedule = async (req, res, next) => {
    try {
        const schedule = await DoctorSchedule.findOne({ doctorId: req.params.doctorId });

        if (!schedule) {
            return error(res, 'schedule.not_found', 404);
        }

        return success(res, 'common.success', schedule);
    } catch (err) {
        next(err);
    }
};

exports.createDoctorSchedule = async (req, res, next) => {
    try {
        const schedule = await DoctorSchedule.create(req.body);
        return success(res, 'common.success', schedule, 201);
    } catch (err) {
        next(err);
    }
};
