const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AccessCode = require('../models/AccessCode');
const { sendAccessCode } = require('../utils/email');

const router = express.Router();

// Verify Paystack Webhook Signature
const verifyPaystackSignature = (req) => {
    const signature = req.headers['x-paystack-signature'];
    const body = req.rawBody;
    
    const expectedSignature = crypto
        .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    return signature === expectedSignature;
};

// Generate random access code
const generateAccessCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create access code
const createAccessCode = async (plan) => {
    let code;
    let exists;
    
    do {
        code = generateAccessCode();
        exists = await AccessCode.findOne({ code });
    } while (exists);

    return await AccessCode.create({ code, plan });
};

// Webhook Endpoint
router.post('/webhook', async (req, res) => {
    // Raw body for signature verification
    req.rawBody = JSON.stringify(req.body);

    if (!verifyPaystackSignature(req)) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
        const { reference, customer, amount, metadata } = event.data;
        
        try {
            // Verify payment with Paystack
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
                    }
                }
            );

            const data = response.data.data;
            
            if (data.status === 'success') {
                const metadataUser = metadata.custom_fields?.find(f => f.variable_name === 'user')?.value;
                const metadataPlan = metadata.custom_fields?.find(f => f.variable_name === 'plan')?.value;
                
                const plan = metadataPlan?.includes('7') ? 7 : 3;
                const username = metadataUser || data.customer?.email?.split('@')[0];
                
                // Find user
                const user = await User.findOne({ username });
                if (!user) {
                    console.log(`❌ User not found: ${username}`);
                    return res.status(404).send('User not found');
                }

                // Check if payment already exists
                const existingPayment = await Payment.findOne({ reference });
                if (existingPayment) {
                    console.log(`✅ Duplicate webhook for ${reference}`);
                    return res.status(200).send('Already processed');
                }

                // Create payment record
                const payment = await Payment.create({
                    reference,
                    username,
                    email: customer.email,
                    amount: amount / 100,
                    plan,
                    currency: data.currency,
                    status: 'success',
                    paidAt: new Date(data.paid_at),
                    metadata
                });

                // Create access code
                const accessCode = await createAccessCode(plan);

                // Update user subscription
                const days = plan === 3 ? 90 : 210;
                user.subscription = {
                    plan,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
                };
                user.paymentPending = false;
                user.pendingPlan = undefined;
                await user.save();

                // Send access code email
                const emailResult = await sendAccessCode(customer.email, username, accessCode.code, plan);

                console.log(`✅ Payment successful for ${username}. Code ${accessCode.code} sent. Reference: ${reference}`);
            }
        } catch (error) {
            console.error('❌ Webhook error:', error.response?.data || error.message);
            return res.status(500).send('Error processing payment');
        }
    }

    res.status(200).send('OK');
});

// Manual code generation endpoint (for admin)
router.post('/generate-code', async (req, res) => {
    const { plan, username } = req.body;
    
    if (![3, 7].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan. Use 3 or 7.' });
    }

    try {
        const code = await createAccessCode(plan);
        
        if (username) {
            const user = await User.findOne({ username });
            if (user) {
                const userPayment = await Payment.findOne({ username, status: 'success' }).sort({ paidAt: -1 });
                if (userPayment) {
                    await sendAccessCode(userPayment.email, username, code.code, plan);
                }
            }
        }

        res.json({ 
            message: 'Code generated successfully',
            code: code.code,
            plan,
            expires: new Date(Date.now() + (plan === 3 ? 90 : 210) * 24 * 60 * 60 * 1000).toLocaleDateString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get payment status
router.get('/status/:reference', async (req, res) => {
    try {
        const payment = await Payment.findOne({ reference: req.params.reference });
        if (!payment) {
            return res.status(404).json({ exists: false });
        }
        res.json({
            exists: true,
            status: payment.status,
            plan: payment.plan,
            username: payment.username
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;