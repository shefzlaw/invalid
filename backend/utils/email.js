const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.sendAccessCode = async (email, username, code, plan) => {
    const mailOptions = {
        from: `"HealthQuiz Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🎉 Welcome ${username}! Your HealthQuiz Access Code`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #1e40af;">HealthQuiz</h1>
                    <p style="color: #64748b;">Premium Access Activated</p>
                </div>

                <div style="background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <h2 style="color: #1e293b; margin-top: 0;">Your Access Code</h2>
                    <div style="background: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
                        <code style="font-size: 24px; font-weight: bold; color: #1e40af; letter-spacing: 2px;">${code}</code>
                    </div>
                    <p><strong>Plan:</strong> ${plan}-Month Premium Access</p>
                    <p><strong>Expires:</strong> ${new Date(Date.now() + (plan === 3 ? 90 : 210) * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>

                <div style="background: #fff7ed; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; margin: 20px 0;">
                    <h3 style="color: #c2410c; margin-top: 0;">How to Activate</h3>
                    <ol style="color: #7c2d12;">
                        <li>Open the HealthQuiz app</li>
                        <li>Click "Enter Access Code"</li>
                        <li>Enter the code above</li>
                        <li>Enjoy full access!</li>
                    </ol>
                </div>

                <p style="color: #64748b; font-size: 0.9rem;">
                    If you didn't make this purchase, please contact support immediately.
                </p>
                
                <hr style="margin: 30px 0; border-color: #e2e8f0;">
                <p style="color: #94a3b8; font-size: 0.8rem; text-align: center;">
                    © ${new Date().getFullYear()} HealthQuiz. All rights reserved.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Access code sent to ${email}`);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('❌ Email error:', error);
        return { success: false, error: error.message };
    }
};