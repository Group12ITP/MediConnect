const mongoose = require('mongoose');

const clinicalThresholdSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['SUGAR', 'CHOLESTEROL', 'BLOOD_PRESSURE'],
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    ranges: {
        sugar: {
            lowMax: Number,
            normalMax: Number
        },
        cholesterol: {
            normalMax: Number,
            highMin: Number
        },
        bp: {
            systolic: {
                normalMax: Number,
                highMin: Number
            },
            diastolic: {
                normalMax: Number,
                highMin: Number
            }
        }
    },
    version: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ClinicalThreshold', clinicalThresholdSchema);
