const mongoose = require('mongoose');

const AccessCodeSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        index: true
    },
    plan: { 
        type: Number, 
        required: true,
        enum: [3, 7]
    },
    used: { 
        type: Boolean, 
        default: false,
        index: true
    },
    usedBy: { 
        type: String,
        index: true
    },
    usedAt: Date,
    createdAt: { 
        type: Date, 
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('AccessCode', AccessCodeSchema);