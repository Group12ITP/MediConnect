const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  deleteUserById,
  getMe,
  updateMe,
  deleteMe,
} = require('../Controllers/userController');
const { protect, adminOnly } = require('../Middleware/auth');

// Admin routes
router.get('/', protect, adminOnly, getAllUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.delete('/:id', protect, adminOnly, deleteUserById);

// Authenticated user self-service
router.get('/me/profile', protect, getMe);
router.put('/me/profile', protect, updateMe);
router.delete('/me/profile', protect, deleteMe);

module.exports = router;

