const mongoose = require('mongoose');

const SecurityLogSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        index: true
    },
    eventType: {
        type: String,
        required: true,
        enum: [
            'multiple_sessions_warning',
            'multiple_locations_warning',
            'new_location_login',
            'account_suspended',
            'logout_other_devices'
        ],
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    details: {
        type: Object,
        default: {}
    }
});

module.exports = mongoose.model('SecurityLog', SecurityLogSchema);