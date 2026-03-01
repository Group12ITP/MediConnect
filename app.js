require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./Middleware/errorHandler');

const authRoutes = require('./Routes/authUserRoutes');
const userRoutes = require('./Routes/userRoutes');
const feedbackRoutes = require('./Routes/feedbackRoutes');
const ratingRoutes = require('./Routes/ratingRoutes');
const paymentRoutes = require('./Routes/paymentRoutes');



const app = express();

const uploadsDir = path.join(__dirname, 'uploads', 'slips');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads/slips directory');
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Telemedicine API is running' });
});

// 404 handler for unknown routes (returns JSON instead of HTML)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

mongoose
  .connect("mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/")
  .then(() => console.log('Connected to MongoDB'))
  .then(() => {
    app.listen(5000, () => {
      console.log(`Server running on port 5000`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });