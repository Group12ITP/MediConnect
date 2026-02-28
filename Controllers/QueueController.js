const QueueService = require('../Services/QueueService');
const QueueSession = require('../Models/QueueSession');
const { success, error } = require('../Utils/response');

exports.createSession = async (req, res, next) => {
    try {
        const { doctorId, date, capacity } = req.body;
        const session = await QueueService.getOrCreateSession(doctorId, date);
        if (capacity) {
            session.capacity = capacity;
            await session.save();
        }
        return success(res, 'queue.session_started', session, 201);
    } catch (err) {
        next(err);
    }
};

exports.getSessions = async (req, res, next) => {
    try {
        const { doctorId, date } = req.query;
        let query = {};
        if (doctorId) query.doctorId = doctorId;
        if (date) query.date = date;

        const sessions = await QueueSession.find(query);
        res.status(200).json({
            ok: true,
            message: res.__('common.success'),
            count: sessions.length,
            data: sessions,
            locale: req.locale
        });
    } catch (err) {
        next(err);
    }
};

exports.getSession = async (req, res, next) => {
    try {
        const session = await QueueSession.findById(req.params.id);
        if (!session) {
            return error(res, 'queue.session_not_found', 404);
        }
        return success(res, 'common.success', session);
    } catch (err) {
        next(err);
    }
};

exports.updateSessionStatus = async (req, res, next) => {
    try {
        const { status } = req.body; // RUNNING, PAUSED, ENDED
        const session = await QueueService.updateSessionStatus(req.params.id, status);

        // Pick a meaningful message based on the new status
        let msgKey = 'queue.session_updated';
        if (status === 'RUNNING') msgKey = 'queue.session_started';
        if (status === 'ENDED') msgKey = 'queue.session_ended';

        return success(res, msgKey, session);
    } catch (err) {
        next(err);
    }
};

exports.checkInPatient = async (req, res, next) => {
    try {
        const { appointmentId } = req.body;
        const result = await QueueService.checkInPatient(appointmentId);
        return success(res, 'common.success', result);
    } catch (err) {
        next(err);
    }
};

exports.callNextPatient = async (req, res, next) => {
    try {
        const session = await QueueService.callNext(req.params.id);
        return success(res, 'common.success', session);
    } catch (err) {
        next(err);
    }
};

exports.markNoShow = async (req, res, next) => {
    try {
        const session = await QueueSession.findById(req.params.id);
        session.events.push({ type: 'NO_SHOW', details: 'Current patient no-show' });
        await session.save();
        return success(res, 'queue.session_updated', session);
    } catch (err) {
        next(err);
    }
};

exports.completeCurrent = async (req, res, next) => {
    try {
        const session = await QueueSession.findById(req.params.id);
        session.events.push({ type: 'COMPLETE', details: 'Current patient completed' });

        const Appointment = require('../Models/Appointment');
        const appt = await Appointment.findOne({
            doctorId: session.doctorId,
            date: session.date,
            status: 'IN_PROGRESS'
        });
        if (appt) {
            appt.status = 'COMPLETED';
            await appt.save();
        }

        await session.save();
        return success(res, 'queue.session_updated', session);
    } catch (err) {
        next(err);
    }
};
