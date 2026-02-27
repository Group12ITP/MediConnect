require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./Middleware/errorHandler');

// Auth Routes
const authRoutes = require('./Routes/authUserRoutes');
const userRoutes = require('./Routes/userRoutes');
const doctorAuthRoutes = require('./Routes/AuthRoutes');
const pharmacistRoutes = require('./Routes/Pharmacistroutes');
const patientRoutes = require('./Routes/Patientroutes');

// Profile & Availability Routes
const profileRoutes = require('./Routes/Profileroutes');
const availabilityRoutes = require('./Routes/Availabilityroutes');
const pharmacyRoutes = require('./Routes/Pharmacyroutes');

// Medical Services Routes
const searchRoutes = require('./Routes/Searchroutes');
const exportRoutes = require('./Routes/ExportRoutes');
const inventoryRoutes = require('./Routes/Inventoryroutes');
const finderRoutes = require('./Routes/Finderroutes');
const brandRoutes = require('./Routes/Brandroutes');

// Feedback & Rating Routes
const feedbackRoutes = require('./Routes/feedbackRoutes');
const ratingRoutes = require('./Routes/ratingRoutes');

// Payment Routes
const paymentRoutes = require('./Routes/paymentRoutes');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is missing. Create a .env file with MONGO_URI and JWT_SECRET.');
}

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'slips');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/slips directory');
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============ USER ROUTES ============
// General Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Doctor Routes
app.use('/api/doctors/auth', doctorAuthRoutes);
app.use('/api/doctors/profile', profileRoutes);
app.use('/api/doctors/availability', availabilityRoutes);
app.use('/api/doctors/search', searchRoutes);
app.use('/api/doctors/export', exportRoutes);

// Pharmacist Routes
app.use('/api/pharmacy/auth', pharmacistRoutes);
app.use('/api/pharmacy/profile', pharmacyRoutes);
app.use('/api/pharmacy/inventory', inventoryRoutes);

// Patient Routes
app.use('/api/patients/auth', patientRoutes);

// ============ MEDICAL SERVICES ROUTES ============
app.use('/api/prescriptions', finderRoutes);
app.use('/api/medicines', brandRoutes);

// ============ FEEDBACK & RATING ROUTES ============
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ratings', ratingRoutes);

// ============ PAYMENT ROUTES ============
app.use('/api/payments', paymentRoutes);

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MediConnect API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unknown routes (returns JSON instead of HTML)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error Handler Middleware
app.use(errorHandler);

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;