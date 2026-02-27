const Payment = require('../Models/Payment');

exports.uploadPaymentSlip = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!req.file || !req.file.filename) {
      return res.status(400).json({
        success: false,
        message: 'Payment slip image is required',
      });
    }
    if (amount == null || amount === '' || Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }
    const slipPath = 'uploads/slips/' + req.file.filename;
    const payment = await Payment.create({
      user: req.user._id,
      amount: Number(amount),
      slipImage: slipPath,
    });
    const populated = await Payment.findById(payment._id).populate('user', 'name email');
    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

exports.approvePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    payment.status = 'approved';
    await payment.save();
    const populated = await Payment.findById(payment._id).populate('user', 'name email');
    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

exports.rejectPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    payment.status = 'rejected';
    await payment.save();
    const populated = await Payment.findById(payment._id).populate('user', 'name email');
    res.json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};
