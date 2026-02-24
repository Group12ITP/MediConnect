const express = require('express');
const {
    createSession,
    getSessions,
    getSession,
    updateSessionStatus,
    checkInPatient,
    callNextPatient,
    markNoShow,
    completeCurrent
} = require('../Controllers/QueueController');
const { protect, authorize } = require('../Middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All routes protected

router.route('/')
    .post(authorize('DOCTOR', 'NURSE'), createSession)
    .get(getSessions);

router.route('/:id')
    .get(getSession);

router.post('/:id/start', authorize('DOCTOR', 'NURSE'), (req, res, next) => { req.body.status = 'RUNNING'; updateSessionStatus(req, res, next); });
router.post('/:id/pause', authorize('DOCTOR', 'NURSE'), (req, res, next) => { req.body.status = 'PAUSED'; updateSessionStatus(req, res, next); });
router.post('/:id/end', authorize('DOCTOR', 'NURSE'), (req, res, next) => { req.body.status = 'ENDED'; updateSessionStatus(req, res, next); });

router.post('/:id/check-in', authorize('DOCTOR', 'NURSE'), checkInPatient);
router.post('/:id/call-next', authorize('DOCTOR', 'NURSE'), callNextPatient);
router.post('/:id/no-show', authorize('DOCTOR', 'NURSE'), markNoShow);
router.post('/:id/complete', authorize('DOCTOR', 'NURSE'), completeCurrent);

module.exports = router;
