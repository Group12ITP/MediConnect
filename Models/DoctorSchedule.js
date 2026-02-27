const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Doctor', // Assuming a Doctor model exists or will exist, though not in scope for CRUD
        unique: true
    },
    timezone: {
        type: String,
        required: true,
        default: 'UTC'
    },
    workingDays: [{
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }],
    dailyStartTime: {
        type: String, // HH:mm
        required: true
    },
    dailyEndTime: {
        type: String, // HH:mm
        required: true
    },
    slotDurationMinutes: {
        type: Number,
        enum: [10, 15, 20, 30, 45, 60],
        required: true
    },
    breaks: [{
        start: String, // HH:mm
        end: String    // HH:mm
    }],
    effectiveFrom: Date,
    effectiveTo: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
