const mongoose = require('mongoose');

const patientReportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    type: {
        type: String,
        enum: ['SUGAR', 'CHOLESTEROL', 'BLOOD_PRESSURE'],
        required: true
    },
    value: {
        sugar: Number,
        cholesterol: Number,
        bp: {
            systolic: Number,
            diastolic: Number
        }
    },
    unit: {
        type: String,
        required: true
    },
    measuredAt: {
        type: Date,
        default: Date.now
    },
    classification: {
        type: String,
        enum: ['LOW', 'NORMAL', 'HIGH'],
        required: true
    },
    thresholdVersion: String
}, {
    timestamps: true
});

module.exports = mongoose.model('PatientReport', patientReportSchema);
