const QueueSession = require('../Models/QueueSession');
const Appointment = require('../Models/Appointment');

class QueueService {

    async getOrCreateSession(doctorId, date) {
        let session = await QueueSession.findOne({ doctorId, date });
        if (!session) {
            session = new QueueSession({
                doctorId,
                date,
                status: 'NOT_STARTED'
            });
            await session.save();
        }
        return session;
    }

    async checkInPatient(appointmentId) {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) throw new Error('Appointment not found');

        const session = await this.getOrCreateSession(appointment.doctorId, appointment.date);

        // Policy A: Assign token at check-in
        const token = session.nextToken;
        session.nextToken++;
        session.checkedInCount++;
        await session.save();

        appointment.status = 'CHECKED_IN';
        appointment.queueToken = token;
        await appointment.save();

        return { appointment, session };
    }

    async updateSessionStatus(sessionId, status) {
        const session = await QueueSession.findById(sessionId);
        if (!session) throw new Error('Session not found');
        session.status = status;
        session.events.push({ type: status === 'RUNNING' ? 'START' : 'PAUSE', details: `Session ${status}` });
        return await session.save();
    }

    async callNext(sessionId) {
        const session = await QueueSession.findById(sessionId);
        if (!session) throw new Error('Session not found');

        if (session.status !== 'RUNNING') throw new Error('Session is not running');

        // Find next checked-in appointment that is not yet completed/no-show
        // This logic assumes sequential tokens. 
        // Ideally we find the appointment with queueToken = currentToken + 1

        session.currentToken++;
        session.events.push({ type: 'CALL_NEXT', details: `Called token ${session.currentToken}` });

        // Update appointment status to IN_PROGRESS
        const appointment = await Appointment.findOne({
            doctorId: session.doctorId,
            date: session.date,
            queueToken: session.currentToken
        });

        if (appointment) {
            appointment.status = 'IN_PROGRESS';
            await appointment.save();
        }

        return await session.save();
    }
}

module.exports = new QueueService();
