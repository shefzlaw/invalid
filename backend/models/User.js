const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    subscription: {
        plan: {
            type: Number,
            enum: [3, 7]
        },
        startDate: Date,
        endDate: Date
    },
    paymentPending: {
        type: Boolean,
        default: false
    },
    pendingPlan: {
        type: Number,
        enum: [3, 7]
    },
    // Anti-sharing protection
    activeSessions: [{
        sessionId: {
            type: String,
            required: true
        },
        loginTime: {
            type: Date,
            default: Date.now
        },
        userAgent: String,
        ip: String,
        lastActive: {
            type: Date,
            default: Date.now
        }
    }],
    maxSessions: {
        type: Number,
        default: 1
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspensionReason: String,
    suspensionDate: Date
});

module.exports = mongoose.model('User', UserSchema);