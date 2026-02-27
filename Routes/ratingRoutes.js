const express = require('express');
const router = express.Router();
const { submitRating, getAllRatings } = require('../Controllers/ratingController');
const { protect, adminOnly } = require('../Middleware/auth');

// Authenticated users can submit their own ratings
router.post('/', protect, submitRating);

// Only admins can see all ratings (includes user details)
router.get('/', protect, adminOnly, getAllRatings);

module.exports = router;
