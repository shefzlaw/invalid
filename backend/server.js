require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Logging Middleware
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} | ${req.method} ${req.path} | ${req.ip}\n`;
    fs.appendFileSync('logs/requests.log', log);
    next();
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Raw body parsing for webhook signature
app.use('/api/paystack/webhook', express.raw({ type: 'application/json' }));

// ====== MODELS ======
const User = require('./models/User');
const Payment = require('./models/Payment');
const AccessCode = require('./models/AccessCode');
const SecurityLog = require('./models/SecurityLog');

// ====== QUESTIONS DATABASE ======
const quizData = {
    "Biomedical Engineering": [
        {
            question: "Which device converts biological signals into electrical signals?",
            options: ["Actuator", "Transducer", "Resistor", "Capacitor"],
            correct: "Transducer"
        },
        {
            question: "What does ECG stand for?",
            options: ["Electro Cardio Graph", "Electrocardiogram", "Electric Cardiac Generator", "Endo Cardio Graph"],
            correct: "Electrocardiogram"
        }
    ],
    "Community Health": [
        {
            question: "Which of the following is a primary prevention strategy?",
            options: ["Vaccination", "Surgery", "Rehabilitation", "Palliative care"],
            correct: "Vaccination"
        },
        {
            question: "What is the main goal of community health programs?",
            options: ["Treat diseases", "Promote wellness", "Increase hospital beds", "Sell medicines"],
            correct: "Promote wellness"
        }
    ],
    "Community Nutrition": [
        {
            question: "Which nutrient deficiency causes kwashiorkor?",
            options: ["Protein", "Vitamin C", "Iron", "Iodine"],
            correct: "Protein"
        },
        {
            question: "Which program aims to reduce malnutrition in children?",
            options: ["ASHA", "ICDS", "NRHM", "AYUSH"],
            correct: "ICDS"
        }
    ],
    "Dental Health": [
        {
            question: "What is the main cause of dental caries?",
            options: ["Sugar", "Bacteria", "Acid", "Poor brushing"],
            correct: "Bacteria"
        },
        {
            question: "Which mineral helps prevent tooth decay?",
            options: ["Calcium", "Fluoride", "Iron", "Zinc"],
            correct: "Fluoride"
        }
    ],
    "Diploma in Epidemiology": [
        {
            question: "What does 'incidence' measure?",
            options: ["Existing cases", "New cases", "Deaths", "Recovery rate"],
            correct: "New cases"
        },
        {
            question: "Which study observes groups rather than individuals?",
            options: ["Case-control", "Cohort", "Ecological", "Cross-sectional"],
            correct: "Ecological"
        }
    ],
    "Diploma in Medical Emergencies": [
        {
            question: "What is the first step in CPR?",
            options: ["Call for help", "Check breathing", "Give compressions", "Open airway"],
            correct: "Call for help"
        },
        {
            question: "Which sign indicates shock?",
            options: ["High BP", "Warm skin", "Rapid pulse", "Slow breathing"],
            correct: "Rapid pulse"
        }
    ],
    "Dispensing Opticianry": [
        {
            question: "What does 'SPH' stand for in a prescription?",
            options: ["Spherical", "Special", "Spectacle", "Sphearing"],
            correct: "Spherical"
        },
        {
            question: "Which lens corrects myopia?",
            options: ["Convex", "Cylindrical", "Plano", "Concave"],
            correct: "Concave"
        }
    ],
    "Environmental Health Sciences": [
        {
            question: "Which gas is a major indoor air pollutant?",
            options: ["Oxygen", "Radon", "Nitrogen", "Helium"],
            correct: "Radon"
        },
        {
            question: "What is the safe level of lead in drinking water?",
            options: ["0.015 mg/L", "0.05 mg/L", "0.1 mg/L", "0.5 mg/L"],
            correct: "0.015 mg/L"
        }
    ],
    "Health Education": [
        {
            question: "Which model emphasizes stages of behavior change?",
            options: ["Health Belief Model", "Transtheoretical Model", "Theory of Reasoned Action", "Social Cognitive Theory"],
            correct: "Transtheoretical Model"
        },
        {
            question: "What is the primary goal of health education?",
            options: ["Diagnose disease", "Change behavior", "Prescribe medicine", "Perform surgery"],
            correct: "Change behavior"
        }
    ],
    "Health Information Management": [
        {
            question: "What does ICD-10 stand for?",
            options: ["International Classification of Diseases", "Indian Code of Diagnosis", "Integrated Clinical Database", "International Care Documentation"],
            correct: "International Classification of Diseases"
        },
        {
            question: "Which system stores patient records electronically?",
            options: ["EHR", "ERP", "CRM", "EMR"],
            correct: "EMR"
        }
    ],
    "Medical Laboratory": [
        {
            question: "Which stain is used for blood smears?",
            options: ["Gram stain", "Wright's stain", "Ziehl-Neelsen", "H&E"],
            correct: "Wright's stain"
        },
        {
            question: "What does CBC stand for?",
            options: ["Complete Blood Count", "Cellular Blood Culture", "Clinical Blood Check", "Controlled Blood Circulation"],
            correct: "Complete Blood Count"
        }
    ],
    "Orthopaedic": [
        {
            question: "Which vitamin is essential for bone health?",
            options: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"],
            correct: "Vitamin D"
        },
        {
            question: "What is a fracture that breaks the skin called?",
            options: ["Simple", "Compound", "Stress", "Hairline"],
            correct: "Compound"
        }
    ],
    "Pharmacy": [
        {
            question: "Which schedule includes highly addictive drugs in many countries?",
            options: ["Schedule I", "Schedule II", "Schedule III", "Schedule IV"],
            correct: "Schedule II"
        },
        {
            question: "What does 'PO' mean in a prescription?",
            options: ["By injection", "By mouth", "By inhalation", "By rectum"],
            correct: "By mouth"
        }
    ],
    "X-Ray and Medical Imaging": [
        {
            question: "Which imaging uses magnetic fields and radio waves?",
            options: ["X-ray", "CT", "MRI", "Ultrasound"],
            correct: "MRI"
        },
        {
            question: "What does 'radiolucent' mean?",
            options: ["Blocks X-rays", "Allows X-rays to pass", "Emits radiation", "Absorbs sound waves"],
            correct: "Allows X-rays to pass"
        }
    ],
    "Anatomy": [
        {
            question: "...................... is a sesamoid bone.",
            options: ["Patella", "Scapular", "Clavicle", "Vertebrae"],
            correct: "Patella"
        },
        {
            question: "The longest bone in the body is the:",
            options: ["Femur", "Tibia", "Humerus", "Fibula"],
            correct: "Femur"
        },
        {
            question: "How many bones are in the human body?",
            options: ["206", "300", "150", "250"],
            correct: "206"
        }
    ]
};

// Generate random 6-digit code
function generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create new access code (auto-generated)
async function createAccessCode(plan) {
    let code;
    let exists;
    
    do {
        code = generateAccessCode();
        const dbCode = await AccessCode.findOne({ code });
        exists = !!dbCode;
    } while (exists);

    const newCode = new AccessCode({
        code,
        plan,
        used: false,
        createdAt: new Date()
    });
    
    await newCode.save();
    return newCode;
}

// Generate unique session ID
function generateSessionId() {
    return require('crypto').randomBytes(32).toString('hex');
}

// Get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Get device fingerprint (for same device detection)
function getDeviceFingerprint(req) {
    const userAgent = req.headers['user-agent'];
    
    // Create hash of device characteristics
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(userAgent);
    return hash.digest('hex');
}

// Session timeout (20 minutes of inactivity)
const SESSION_TIMEOUT = 20 * 60 * 1000; // 20 minutes

// Warning threshold
const WARNING_THRESHOLD = 5;
const SUSPENSION_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

// Security log event
async function logSecurityEvent(username, eventType, details = {}) {
    const log = new SecurityLog({
        username,
        eventType,
        timestamp: new Date(),
        details
    });
    await log.save();
}

// Generate initial access codes if none exist
async function initializeAccessCodes() {
    try {
        const count = await AccessCode.countDocuments();
        if (count === 0) {
            console.log('📝 Creating initial access codes...');
            // Create 20 initial codes (10 for 3-month, 10 for 7-month)
            for (let i = 0; i < 10; i++) {
                await createAccessCode(3);
                await createAccessCode(7);
            }
            console.log('✅ 20 access codes generated');
        } else {
            console.log(`✅ ${count} access codes already exist`);
        }
    } catch (error) {
        console.error('❌ Code initialization error:', error);
    }
}

// Check for suspicious activity
async function checkSuspiciousActivity(user, newSession) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Check if user has been warned recently
    const recentWarnings = await SecurityLog.countDocuments({
        username: user.username,
        eventType: 'multiple_sessions_warning',
        timestamp: { $gte: sevenDaysAgo }
    });
    
    // Get distinct IPs and devices from active sessions
    const activeIPs = new Set();
    const activeDevices = new Set();
    
    user.activeSessions.forEach(session => {
        if (session.ip) activeIPs.add(session.ip);
        if (session.deviceFingerprint) activeDevices.add(session.deviceFingerprint);
    });
    
    // Add new session info
    if (newSession.ip) activeIPs.add(newSession.ip);
    if (newSession.deviceFingerprint) activeDevices.add(newSession.deviceFingerprint);
    
    const result = {
        allowed: true,
        warning: false,
        message: 'Login successful',
        sessionsToTerminate: []
    };
    
    // Check if same IP but different device (possible sharing)
    const sameIPDifferentDevice = user.activeSessions.some(session => 
        session.ip === newSession.ip && 
        session.deviceFingerprint !== newSession.deviceFingerprint
    );
    
    if (sameIPDifferentDevice) {
        result.warning = true;
        result.message = 'Warning: Multiple devices detected on same network';
        
        if (recentWarnings >= WARNING_THRESHOLD) {
            // Suspend for 3 days
            user.isSuspended = true;
            user.suspensionReason = 'Multiple devices detected on same network after warnings';
            user.suspensionExpiry = new Date(Date.now() + SUSPENSION_DURATION);
            user.activeSessions = [];
            await user.save();
            
            result.allowed = false;
            result.message = 'Account suspended for 3 days due to suspicious activity';
            
            await logSecurityEvent(user.username, 'account_suspended', {
                reason: 'Multiple devices on same network',
                warnings: recentWarnings
            });
        } else {
            await logSecurityEvent(user.username, 'multiple_sessions_warning', {
                warnings: recentWarnings + 1,
                maxWarnings: WARNING_THRESHOLD
            });
        }
        
        return result;
    }
    
    // Check if 3+ different IPs (suspicious)
    if (activeIPs.size >= 3) {
        result.warning = true;
        result.message = 'Warning: Multiple locations detected';
        
        if (recentWarnings >= WARNING_THRESHOLD) {
            // Suspend for 3 days
            user.isSuspended = true;
            user.suspensionReason = 'Multiple locations detected after warnings';
            user.suspensionExpiry = new Date(Date.now() + SUSPENSION_DURATION);
            user.activeSessions = [];
            await user.save();
            
            result.allowed = false;
            result.message = 'Account suspended for 3 days due to multiple locations';
            
            await logSecurityEvent(user.username, 'account_suspended', {
                reason: 'Multiple locations',
                ipCount: activeIPs.size,
                warnings: recentWarnings
            });
        } else {
            await logSecurityEvent(user.username, 'multiple_locations_warning', {
                ipCount: activeIPs.size,
                warnings: recentWarnings + 1
            });
        }
        
        return result;
    }
    
    // If same device, allow multiple tabs (no action needed)
    if (activeDevices.size === 1 && activeIPs.size === 1) {
        return result;
    }
    
    // Log the login from new location/device
    if (activeIPs.size > 1 || activeDevices.size > 1) {
        await logSecurityEvent(user.username, 'new_location_login', {
            ipCount: activeIPs.size,
            deviceCount: activeDevices.size
        });
    }
    
    return result;
}

// Clean up expired sessions and suspensions periodically
setInterval(async () => {
    try {
        const now = new Date();
        const twentyMinutesAgo = new Date(Date.now() - SESSION_TIMEOUT);
        const expiredSuspension = new Date(Date.now() - SUSPENSION_DURATION);
        
        // Remove expired sessions (20 minutes inactive)
        await User.updateMany(
            {},
            { $pull: { activeSessions: { lastActive: { $lt: twentyMinutesAgo } } } }
        );
        
        // Remove expired suspensions
        await User.updateMany(
            { isSuspended: true, suspensionExpiry: { $lt: now } },
            { 
                isSuspended: false,
                suspensionReason: null,
                suspensionExpiry: null
            }
        );
        
        console.log('✅ Session cleanup completed');
    } catch (error) {
        console.error('❌ Session cleanup error:', error);
    }
}, 300000); // Run every 5 minutes

// ====== API ROUTES ======

// Register User
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;
        
        if (!username || !password || !email) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already exists' 
            });
        }

        const newUser = new User({
            username,
            password: btoa(password),
            email,
            subscription: null,
            paymentPending: false,
            maxSessions: 1,
            isSuspended: false,
            activeSessions: [],
            securityWarnings: 0
        });

        await newUser.save();
        
        res.json({ 
            success: true, 
            message: 'User registered successfully',
            user: {
                username: newUser.username,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Login User
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userAgent = req.headers['user-agent'];
        const ip = getClientIP(req);
        const deviceFingerprint = getDeviceFingerprint(req);
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check if account is suspended
        if (user.isSuspended) {
            const now = new Date();
            if (user.suspensionExpiry && now < user.suspensionExpiry) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Account suspended until ${user.suspensionExpiry.toLocaleString()}. Contact support.` 
                });
            } else {
                // Suspension expired, reactivate account
                user.isSuspended = false;
                user.suspensionReason = null;
                user.suspensionExpiry = null;
                await user.save();
            }
        }

        if (user.password !== btoa(password)) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate new session ID
        const sessionId = generateSessionId();

        // Create new session object
        const newSession = {
            sessionId,
            loginTime: new Date(),
            userAgent,
            ip,
            deviceFingerprint,
            lastActive: new Date()
        };

        // Check for suspicious activity
        const securityCheck = await checkSuspiciousActivity(user, newSession);
        
        if (!securityCheck.allowed) {
            return res.status(403).json({ 
                success: false, 
                message: securityCheck.message 
            });
        }

        // Remove expired sessions (20 minutes inactive)
        const twentyMinutesAgo = new Date(Date.now() - SESSION_TIMEOUT);
        user.activeSessions = user.activeSessions.filter(session => {
            return new Date(session.lastActive) > twentyMinutesAgo;
        });

        // If same device, allow multiple tabs
        const sameDevice = user.activeSessions.some(session => 
            session.deviceFingerprint === deviceFingerprint
        );

        if (sameDevice) {
            // Allow multiple tabs on same device
            user.activeSessions = user.activeSessions.filter(session => 
                session.deviceFingerprint !== deviceFingerprint
            );
        } else {
            // Different device, terminate other sessions
            securityCheck.sessionsToTerminate = user.activeSessions.map(s => s.sessionId);
            user.activeSessions = [];
        }

        // Add new session
        user.activeSessions.push(newSession);
        await user.save();

        res.json({ 
            success: true, 
            message: securityCheck.message,
            sessionId: sessionId,
            warning: securityCheck.warning,
            sessionsTerminated: securityCheck.sessionsToTerminate,
            user: {
                username: user.username,
                email: user.email,
                subscription: user.subscription,
                paymentPending: user.paymentPending,
                isSuspended: user.isSuspended,
                activeSessions: user.activeSessions.length
            }
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Validate Session
app.post('/api/validate-session', async (req, res) => {
    try {
        const { username, sessionId } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ 
                valid: false, 
                message: 'User not found' 
            });
        }

        // Check if account is suspended
        if (user.isSuspended) {
            const now = new Date();
            if (user.suspensionExpiry && now < user.suspensionExpiry) {
                return res.json({ 
                    valid: false, 
                    suspended: true,
                    message: `Account suspended until ${user.suspensionExpiry.toLocaleString()}` 
                });
            } else {
                // Suspension expired
                user.isSuspended = false;
                user.suspensionReason = null;
                user.suspensionExpiry = null;
                await user.save();
            }
        }

        // Remove expired sessions
        const twentyMinutesAgo = new Date(Date.now() - SESSION_TIMEOUT);
        user.activeSessions = user.activeSessions.filter(session => {
            return new Date(session.lastActive) > twentyMinutesAgo;
        });
        await user.save();

        // Find session
        const session = user.activeSessions.find(s => s.sessionId === sessionId);
        
        if (!session) {
            return res.json({ 
                valid: false, 
                message: 'Invalid or expired session' 
            });
        }

        // Update last active time
        session.lastActive = new Date();
        await user.save();

        res.json({ 
            valid: true,
            suspended: false,
            message: 'Session valid',
            username: user.username
        });

    } catch (error) {
        res.status(500).json({ 
            valid: false, 
            message: 'Server error' 
        });
    }
});

// Logout
app.post('/api/logout', async (req, res) => {
    try {
        const { username, sessionId } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Remove session
        user.activeSessions = user.activeSessions.filter(s => s.sessionId !== sessionId);
        await user.save();

        res.json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Logout from other devices
app.post('/api/logout-other-devices', async (req, res) => {
    try {
        const { username, keepSessionId } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const terminatedSessions = user.activeSessions
            .filter(s => s.sessionId !== keepSessionId)
            .map(s => s.sessionId);

        user.activeSessions = user.activeSessions.filter(s => s.sessionId === keepSessionId);
        await user.save();

        await logSecurityEvent(username, 'logout_other_devices', {
            sessionsTerminated: terminatedSessions.length
        });

        res.json({ 
            success: true, 
            message: 'Logged out from other devices',
            terminated: terminatedSessions.length
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user subscription
app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check subscription expiration
        if (user.subscription) {
            const endDate = new Date(user.subscription.endDate);
            if (new Date() > endDate) {
                user.subscription = null;
                user.paymentPending = false;
                await user.save();
            }
        }
        
        res.json({
            success: true,
            user: {
                username: user.username,
                email: user.email,
                subscription: user.subscription,
                paymentPending: user.paymentPending,
                createdAt: user.createdAt,
                isSuspended: user.isSuspended,
                suspensionReason: user.suspensionReason,
                suspensionExpiry: user.suspensionExpiry,
                activeSessions: user.activeSessions.length,
                maxSessions: user.maxSessions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Generate new access codes
app.post('/api/admin/generate-codes', async (req, res) => {
    try {
        const { count, plan } = req.body;
        
        if (!count || !plan || ![3, 7].includes(plan)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid parameters' 
            });
        }
        
        const generated = [];
        for (let i = 0; i < count; i++) {
            const code = await createAccessCode(plan);
            generated.push(code.code);
        }
        
        res.json({ 
            success: true, 
            message: `${count} codes generated`,
            codes: generated 
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Get available codes count
app.get('/api/admin/codes-count', async (req, res) => {
    try {
        const available = await AccessCode.countDocuments({ used: false });
        const total = await AccessCode.countDocuments();
        
        res.json({
            success: true,
            available: available,
            total: total,
            message: `${available} codes available`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Get security logs
app.get('/api/admin/security-logs/:username', async (req, res) => {
    try {
        const logs = await SecurityLog.find({ username: req.params.username })
            .sort({ timestamp: -1 })
            .limit(50);
        
        res.json({
            success: true,
            logs: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all departments
app.get('/api/departments', async (req, res) => {
    try {
        const username = req.query.username;
        const sessionId = req.query.sessionId;

        // Validate session if provided
        if (username && sessionId) {
            const user = await User.findOne({ username });
            if (user && user.isSuspended) {
                const now = new Date();
                if (user.suspensionExpiry && now < user.suspensionExpiry) {
                    return res.status(403).json({ 
                        error: `Account suspended until ${user.suspensionExpiry.toLocaleString()}` 
                    });
                } else {
                    user.isSuspended = false;
                    user.suspensionReason = null;
                    user.suspensionExpiry = null;
                    await user.save();
                }
            }
        }

        const departments = Object.keys(quizData);
        res.json({ 
            departments, 
            total: departments.length
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get questions for a specific department
app.get('/api/questions/:department', async (req, res) => {
    try {
        const username = req.query.username;
        const sessionId = req.query.sessionId;

        // Validate session
        if (username && sessionId) {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            if (user.isSuspended) {
                const now = new Date();
                if (user.suspensionExpiry && now < user.suspensionExpiry) {
                    return res.status(403).json({ 
                        error: `Account suspended until ${user.suspensionExpiry.toLocaleString()}` 
                    });
                } else {
                    user.isSuspended = false;
                    user.suspensionReason = null;
                    user.suspensionExpiry = null;
                    await user.save();
                }
            }

            const session = user.activeSessions.find(s => s.sessionId === sessionId);
            if (!session) {
                return res.status(401).json({ error: 'Invalid session' });
            }

            // Check session timeout (20 minutes)
            const twentyMinutesAgo = new Date(Date.now() - SESSION_TIMEOUT);
            if (new Date(session.lastActive) < twentyMinutesAgo) {
                // Remove expired session
                user.activeSessions = user.activeSessions.filter(s => s.sessionId !== sessionId);
                await user.save();
                return res.status(401).json({ error: 'Session expired due to inactivity' });
            }

            // Update last active time
            session.lastActive = new Date();
            await user.save();
        }
        
        const dept = req.params.department;
        const limit = parseInt(req.query.limit) || null;
        
        if (!quizData[dept]) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        let questions = [...quizData[dept]];
        questions.sort(() => 0.5 - Math.random());
        
        if (limit) {
            questions = questions.slice(0, limit);
        }
        
        res.json({ questions, total: questions.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Verify access code
app.post('/api/verify-code', async (req, res) => {
    try {
        const { code, username, sessionId } = req.body;
        
        // Validate session
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (user.isSuspended) {
            const now = new Date();
            if (user.suspensionExpiry && now < user.suspensionExpiry) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Account suspended until ${user.suspensionExpiry.toLocaleString()}` 
                });
            } else {
                user.isSuspended = false;
                user.suspensionReason = null;
                user.suspensionExpiry = null;
                await user.save();
            }
        }

        const session = user.activeSessions.find(s => s.sessionId === sessionId);
        if (!session) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid session' 
            });
        }

        if (!code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Code is required' 
            });
        }
        
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid code format' 
            });
        }
        
        // Check in database
        const dbCode = await AccessCode.findOne({ code });
        if (!dbCode) {
            return res.json({ 
                success: false, 
                message: 'Invalid code' 
            });
        }
        
        if (dbCode.used) {
            return res.json({ 
                success: false, 
                message: 'Code already used' 
            });
        }
        
        // Mark as used
        dbCode.used = true;
        dbCode.usedBy = username;
        dbCode.usedAt = new Date();
        await dbCode.save();
        
        // Update user subscription
        const plan = dbCode.plan;
        const days = plan === 3 ? 90 : 210;
        user.subscription = {
            plan: plan,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
        };
        user.paymentPending = false;
        await user.save();
        
        res.json({ 
            success: true, 
            message: `Code verified! ${plan}-month access unlocked`,
            plan: plan
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Webhook Signature Verification
const verifyPaystackSignature = (req) => {
    const signature = req.headers['x-paystack-signature'];
    const body = req.rawBody;
    
    const expectedSignature = require('crypto')
        .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

    return signature === expectedSignature;
};

// Paystack Webhook Endpoint
app.post('/api/paystack/webhook', async (req, res) => {
    req.rawBody = JSON.stringify(req.body);

    if (!verifyPaystackSignature(req)) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).send('Unauthorized');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
        const { reference, customer, amount, metadata } = event.data;
        
        try {
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
                const username = metadataUser || customer.email?.split('@')[0];
                
                console.log(`✅ Payment successful for ${username}. Reference: ${reference}`);
            }
        } catch (error) {
            console.error('❌ Webhook error:', error.response?.data || error.message);
            return res.status(500).send('Error processing payment');
        }
    }

    res.status(200).send('OK');
});

// Test Route
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
            <h1 style="color: #1e40af;">🏥 HealthQuiz Backend</h1>
            <p style="color: #64748b;">API Server is running successfully</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3>🔒 Advanced Security Features</h3>
                <p>✅ 5 Warnings Before Suspension</p>
                <p>✅ 3-Day Temporary Suspension</p>
                <p>✅ 20-Minute Session Timeout</p>
                <p>✅ Multiple Tabs Allowed on Same Device</p>
                <p>✅ Logout on Other Devices</p>
                <p>✅ Security Logging</p>
            </div>

            <div style="color: #94a3b8; font-size: 0.9rem; margin-top: 30px;">
                <p>HealthQuiz Backend System v1.0</p>
                <p>© ${new Date().getFullYear()}</p>
            </div>
        </div>
    `);
});

// Error Handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Something went wrong' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully');
    // Initialize access codes
    initializeAccessCodes();
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('💥 Closed express server');
        mongoose.connection.close(false, () => {
            console.log('🔌 Closed MongoDB connection');
            process.exit(0);
        });
    });
});