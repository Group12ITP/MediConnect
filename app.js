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
app.use('/api/doctors', require('./Routes/doctorRoutes'));
app.use('/api/appointments', require('./Routes/appointmentRoutes'));
app.use('/api/queue-sessions', require('./Routes/queueRoutes'));
app.use('/api/patients/:patientId/reports', require('./Routes/reportRoutes'));

// Error Handler
const errorHandler = require('./Middleware/errorMiddleware');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});