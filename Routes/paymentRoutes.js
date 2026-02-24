const express = require('express');
const router = express.Router();
const {
  uploadPaymentSlip,
  getAllPayments,
  getMyPayments,
  approvePayment,
  rejectPayment,
} = require('../Controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../Middleware/upload');

router.post('/upload', protect, upload.single('slipImage'), uploadPaymentSlip);
router.get('/', protect, adminOnly, getAllPayments);
router.get('/my', protect, getMyPayments);
router.put('/:id/approve', protect, adminOnly, approvePayment);
router.put('/:id/reject', protect, adminOnly, rejectPayment);

module.exports = router;
