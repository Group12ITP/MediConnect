const express = require('express');
const { createAppointment, getAppointments, getAppointment, updateAppointment, downloadICS } = require('../Controllers/AppointmentController');
const { protect, authorize } = require('../Middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes protected

router.route('/')
    .get(getAppointments)
    .post(authorize('PATIENT'), createAppointment);

router.route('/:id')
    .get(getAppointment)
    .patch(updateAppointment);

router.get('/:id/ics', downloadICS); // Authorization logic inside controller

module.exports = router;
