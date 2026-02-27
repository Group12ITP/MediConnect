const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const i18n = require('i18n');
const path = require('path');

const app = express();

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

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialise i18n on every request (must come BEFORE routes)
app.use(i18n.init);

// Locale detection: Accept-Language header + ?lang query param
app.use(require('./Middleware/i18nMiddleware'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/appointments', require('./Routes/appointmentRoutes'));
app.use('/api/patients/:patientId/reports', require('./Routes/patientReportRoutes'));
app.use('/api/reports', require('./Routes/reportRoutes'));
app.use('/api/i18n', require('./Routes/i18nRoutes'));

// ─── Error Handler ────────────────────────────────────────────────────────────
const errorHandler = require('./Middleware/errorMiddleware');
app.use(errorHandler);

// ─── Connect to MongoDB, then start server ────────────────────────────────────
mongoose
    .connect("mongodb+srv://Admin:iaL2kF1B9uLr2zcu@mediconnectcluster.03lembh.mongodb.net/mediconnect")
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(5000, () => console.log("Server running on port 5000"));
    })
    .catch((err) => console.log(err));
