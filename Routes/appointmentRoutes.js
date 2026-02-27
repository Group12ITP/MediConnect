const express = require('express');
const {
    createAppointment,
    getAppointments,
    getAppointment,
    updateAppointment,
    downloadICS,
    getDailyCounter
} = require('../Controllers/AppointmentController');
const { protect, authorize } = require('../Middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes protected

// Daily slot counter for a doctor — must be BEFORE /:id to avoid route conflict
// GET /api/appointments/counter/:doctorId?date=YYYY-MM-DD
router.get('/counter/:doctorId', getDailyCounter);

router.route('/')
    .get(getAppointments)
    .post(authorize('PATIENT'), createAppointment);

router.route('/:id')
    .get(getAppointment)
    .patch(updateAppointment);

router.get('/:id/ics', downloadICS);

module.exports = router;

