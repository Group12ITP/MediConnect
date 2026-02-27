const express = require('express');
const router = express.Router();
const { submitFeedback, getAllFeedback } = require('../Controllers/feedbackController');
const { protect, adminOnly } = require('../middleware/auth');

// Authenticated users can submit feedback
router.post('/', protect, submitFeedback);

// Only admins can see all feedback (includes user details)
router.get('/', protect, adminOnly, getAllFeedback);

module.exports = router;
