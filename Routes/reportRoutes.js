const express = require('express');
const router = express.Router();
const Appointment = require('../Models/Appointment');
const QueueSession = require('../Models/QueueSession');
const {
    generateAllAppointmentsPDF,
    generateSingleAppointmentPDF,
    generateQueueReportPDF
} = require('../Utils/pdfGenerator');
const { protect } = require('../Middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ─── Helper: pipe PDFKit doc to Express response ──────────────────────────────
function streamPDF(doc, res, filename) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
}

// ─── 1. All Appointments Report ───────────────────────────────────────────────
// GET /api/reports/appointments
// Query params: ?date=YYYY-MM-DD  &doctorId=xxx  &status=BOOKED
router.get('/appointments', async (req, res, next) => {
    try {
        const query = {};
        if (req.query.date) query.date = req.query.date;
        if (req.query.doctorId) query.doctorId = req.query.doctorId;
        if (req.query.status) query.status = req.query.status;

        // Patients can only see their own
        if (req.user.role === 'PATIENT') {
            query.patientId = req.user.id;
        }

        const appointments = await Appointment.find(query).sort({ date: 1, startTime: 1 });
        const doc = generateAllAppointmentsPDF(appointments, req.query);

        const dateTag = req.query.date || new Date().toISOString().slice(0, 10);
        streamPDF(doc, res, `MediConnect_Appointments_${dateTag}.pdf`);
    } catch (err) {
        next(err);
    }
});

// ─── 2. Single Appointment Report ────────────────────────────────────────────
// GET /api/reports/appointments/:id
router.get('/appointments/:id', async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ ok: false, message: res.__('appointment.not_found'), locale: req.locale });
        }

        // Patients can only download their own
        if (req.user.role === 'PATIENT' && String(appointment.patientId) !== req.user.id) {
            return res.status(403).json({ ok: false, message: res.__('auth.forbidden'), locale: req.locale });
        }

        const doc = generateSingleAppointmentPDF(appointment);
        streamPDF(doc, res, `MediConnect_Appointment_${appointment._id}.pdf`);
    } catch (err) {
        next(err);
    }
});

// ─── 3. Queue Session Report ──────────────────────────────────────────────────
// GET /api/reports/queue/:id
router.get('/queue/:id', async (req, res, next) => {
    try {
        const session = await QueueSession.findById(req.params.id);

        if (!session) {
            return res.status(404).json({ ok: false, message: res.__('queue.session_not_found'), locale: req.locale });
        }

        const doc = generateQueueReportPDF(session);
        streamPDF(doc, res, `MediConnect_QueueSession_${session.date}_${session._id}.pdf`);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
