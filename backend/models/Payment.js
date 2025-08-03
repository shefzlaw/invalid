const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    reference: { 
        type: String, 
        required: true, 
        unique: true 
    },
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    amount: { 
        type: Number, 
        required: true 
    },
    plan: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        default: 'NGN' 
    },
    status: { 
        type: String, 
        default: 'pending' 
    },
    paidAt: Date,
    meta: Object,
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);