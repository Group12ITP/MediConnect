const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./Config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes

app.use('/api/appointments', require('./Routes/appointmentRoutes'));

// Error Handler
const errorHandler = require('./Middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./Middleware/errorHandler');


const authRoutes = require("./Routes/AuthRoutes");
const profileRoutes = require("./Routes/Profileroutes");
const availabilityRoutes = require("./Routes/Availabilityroutes");
const searchRoutes = require("./Routes/Searchroutes");
const exportRoutes = require("./Routes/ExportRoutes");

const userAuthRoutes = require('./Routes/authUserRoutes');
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

const pharmacistRoutes = require("./Routes/Pharmacistroutes");
const patientRoutes = require("./Routes/Patientroutes");
const pharmacyRoutes = require("./Routes/Pharmacyroutes");
const inventoryRoutes = require("./Routes/Inventoryroutes");
const finderRoutes = require("./Routes/Finderroutes");
const brandRoutes = require("./Routes/Brandroutes");


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api/pharmacy/auth", pharmacistRoutes);
app.use("/api/patients/auth", patientRoutes);
app.use("/api/doctors/auth", authRoutes);
app.use("/api/doctors/profile", profileRoutes);
app.use("/api/doctors/availability", availabilityRoutes);
app.use("/api/doctors/search", searchRoutes);
app.use("/api/doctors/export", exportRoutes);
app.use("/api/pharmacy/profile", pharmacyRoutes);
app.use("/api/pharmacy/inventory", inventoryRoutes);
app.use("/api/prescriptions", finderRoutes);
app.use("/api/medicines", brandRoutes);

app.use('/api/auth', userAuthRoutes);
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
  .connect(
    "mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/",
  )
  .then(() => console.log("Connected to MongoDB"))
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => console.log(err));
