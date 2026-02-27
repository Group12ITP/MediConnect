const User = require('../Models/User');

// Admin: get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, data: users });
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

// Admin: get single user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
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

// Admin: delete user by ID
exports.deleteUserById = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
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

// Auth: get own profile
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
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

// Auth: update own profile (name, email, password)
exports.updateMe = async (req, res, next) => {
  try {
    const updates = {};
    const { name, email, password } = req.body;
    if (name) updates.name = name;
    if (email) updates.email = email;

    let user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (password) {
      user.password = password; // will be hashed by pre('save')
    }

    Object.assign(user, updates);
    await user.save();

    user = user.toObject();
    delete user.password;

    res.json({ success: true, data: user });
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

// Auth: delete own account
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account deleted successfully' });
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

