const express = require('express');
const { createReport, getReports } = require('../Controllers/ReportController');
const { protect, authorize } = require('../Middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
    .get(getReports)
    .post(createReport);

module.exports = router;
