const Rating = require('../Models/Rating');

exports.submitRating = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    if (rating == null || rating === '') {
      return res.status(400).json({
        success: false,
        message: 'Rating (1-5) is required',
      });
    }
    const num = Number(rating);
    if (num < 1 || num > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }
    const doc = await Rating.create({
      user: req.user._id,
      rating: num,
      review: (review && review.trim()) || '',
    });
    const populated = await Rating.findById(doc._id).populate('user', 'name email');
    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

exports.getAllRatings = async (req, res, next) => {
  try {
    const ratings = await Rating.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json({
      success: true,
      count: ratings.length,
      data: ratings,
    });
  } catch (error) {
    if (typeof next === 'function') {
      return next(error);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
