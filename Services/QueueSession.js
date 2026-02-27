const mongoose = require('mongoose');

const queueSessionSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    sessionStartTime: String,
    sessionEndTime: String,
    capacity: {
        type: Number,
        default: 30
    },
    bookedCount: {
        type: Number,
        default: 0
    },
    checkedInCount: {
        type: Number,
        default: 0
    },
    currentToken: {
        type: Number,
        default: 0
    },
    nextToken: {
        type: Number,
        default: 1
    },
    status: {
        type: String,
        enum: ['NOT_STARTED', 'RUNNING', 'PAUSED', 'ENDED'],
        default: 'NOT_STARTED'
    },
    events: [{
        type: {
            type: String,
            enum: ['START', 'PAUSE', 'RESUME', 'END', 'CALL_NEXT', 'NO_SHOW', 'COMPLETE']
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('QueueSession', queueSessionSchema);
