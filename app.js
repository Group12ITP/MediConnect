require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const errorHandler = require('./Middleware/errorHandler');
const helmet = require('helmet');
const i18n = require('i18n');
const cors = require('cors');

// ─── i18n Configuration ───────────────────────────────────────────────────────
i18n.configure({
    locales: ['en', 'si', 'ta'],
    defaultLocale: 'en',
    directory: path.join(__dirname, 'locales'),
    autoReload: true,
    syncFiles: true,
    objectNotation: true,        // enables dot-notation keys e.g. "appointment.created"
    queryParameter: 'lang',      // ?lang=si support
    register: global             // makes __() available globally on req/res
});



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
app.use(i18n.init);
app.use(helmet());
app.use(cors());


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

app.use(require('./Middleware/i18nMiddleware'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/appointments', require('./Routes/appointmentRoutes'));
app.use('/api/patients/:patientId/reports', require('./Routes/patientReportRoutes'));
app.use('/api/reports', require('./Routes/reportRoutes'));
app.use('/api/i18n', require('./Routes/i18nRoutes'));

// 404 handler for unknown routes (returns JSON instead of HTML)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

const errorHandler2 = require('./Middleware/errorMiddleware');
app.use(errorHandler2);

mongoose
  .connect(
    "mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/",
  )
  .then(() => console.log("Connected to MongoDB"))
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => console.log(err));
