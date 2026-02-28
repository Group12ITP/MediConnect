const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams gives access to :patientId

const {
    createReport,
    getReports,
    getReferenceRanges
} = require('../Controllers/ReportController');
const { protect } = require('../Middleware/authMiddleware');

router.use(protect);

// GET  /api/patients/:patientId/reports/reference  — clinical reference ranges
router.get('/reference', getReferenceRanges);

// GET  /api/patients/:patientId/reports?latest=true&type=SUGAR
router.get('/', getReports);

// POST /api/patients/:patientId/reports  — create + auto-analyse
router.post('/', createReport);

module.exports = router;
