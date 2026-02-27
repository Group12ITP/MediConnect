const mongoose = require('mongoose');

/**
 * PatientReport — upgraded with 6-level classification and doctor alert flag.
 *
 * Classification levels (WHO / AHA / ADA guidelines):
 *   CRITICAL_LOW   — dangerously low, immediate intervention
 *   LOW            — below normal range
 *   LOW_WARNING    — borderline low, monitor closely
 *   NORMAL         — healthy range
 *   HIGH_WARNING   — borderline high, lifestyle changes advised
 *   HIGH           — above normal, medical attention needed
 *   CRITICAL_HIGH  — dangerously high, immediate intervention
 */
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
        sugar: Number,          // mg/dL  (fasting blood glucose)
        cholesterol: Number,          // mg/dL  (total cholesterol)
        bp: {
            systolic: Number,        // mmHg
            diastolic: Number         // mmHg
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

    // ── Analysis Result (auto-populated on save) ────────────────────────────
    classification: {
        type: String,
        enum: ['CRITICAL_LOW', 'LOW', 'LOW_WARNING', 'NORMAL', 'HIGH_WARNING', 'HIGH', 'CRITICAL_HIGH'],
        required: true
    },

    /**
     * Structured analysis block:
     * {
     *   level       : "CRITICAL_HIGH",
     *   label       : "Stage 2 Hypertension",
     *   message     : "Your blood pressure is critically high...",
     *   advice      : "Seek immediate medical attention.",
     *   requiresDoctor  : true,
     *   alertPriority   : "IMMEDIATE" | "URGENT" | "ROUTINE" | "NONE",
     *   parameters  : [ { name, value, unit, status, normalRange } ]
     * }
     */
    analysis: {
        level: String,
        label: String,
        message: String,
        advice: String,
        requiresDoctor: { type: Boolean, default: false },
        alertPriority: { type: String, enum: ['IMMEDIATE', 'URGENT', 'ROUTINE', 'NONE'], default: 'NONE' },
        parameters: [{
            name: String,
            value: Number,
            unit: String,
            status: String,
            normalRange: String
        }]
    },

    thresholdVersion: { type: String, default: 'WHO-2023' }
}, {
    timestamps: true
});

module.exports = mongoose.model('PatientReport', patientReportSchema);
