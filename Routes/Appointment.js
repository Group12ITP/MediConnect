const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    nurseId: {
        type: mongoose.Schema.Types.ObjectId
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    startTime: {
        type: String, // HH:mm
        required: true
    },
    endTime: {
        type: String, // HH:mm
        required: true
    },
    status: {
        type: String,
        enum: ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'],
        default: 'BOOKED'
    },
    queueToken: {
        type: Number
    },
    reason: String,
    notes: String,
    slotKey: {
        type: String, // doctorId|date|startTime
        unique: true
    }
}, {
    timestamps: true
});

// Compound index to prevent double booking
appointmentSchema.index({ doctorId: 1, date: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
