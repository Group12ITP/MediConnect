const express = require('express');
const { getDoctorSlots, getDoctorSchedule, createDoctorSchedule } = require('../Controllers/ScheduleController');
const { protect, authorize } = require('../Middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.route('/:doctorId/slots')
    .get(protect, getDoctorSlots);

router.route('/:doctorId/schedule')
    .get(protect, authorize('DOCTOR', 'NURSE'), getDoctorSchedule)
    .post(protect, authorize('DOCTOR'), createDoctorSchedule); // Helper for demo

module.exports = router;
