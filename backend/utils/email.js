const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
}

/**
 * Send an email with a 6-digit OTP verification code.
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} type - 'register' or 'reset'
 */
async function sendOtpEmail(to, otp, type = 'register') {
  const subject = type === 'register' 
    ? 'MediGrid: Verify Your Account Registration' 
    : 'MediGrid: Reset Your Account Password';

  const titleText = type === 'register'
    ? 'Verify Your Registration'
    : 'Reset Your Password';

  const bodyText = type === 'register'
    ? 'Thank you for choosing MediGrid. Please use the following 6-digit One-Time Password (OTP) to complete your account registration. This code will expire in 10 minutes.'
    : 'We received a request to reset the password for your MediGrid account. Please use the following 6-digit One-Time Password (OTP) to proceed. This code will expire in 10 minutes.';

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; rounded-2xl; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://medigrid.ai/logos/Logo%20(MAIN).png" alt="MediGrid" style="height: 35px; width: auto;" onerror="this.style.display='none'" />
        <h2 style="color: #0ea5e9; margin: 10px 0 0 0; font-weight: 800; font-size: 20px;">MediGrid AI</h2>
      </div>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
      <h3 style="color: #1e293b; font-size: 16px; font-weight: 700; margin-top: 0;">${titleText}</h3>
      <p style="color: #475569; font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
        ${bodyText}
      </p>
      <div style="text-align: center; background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
        <span style="font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #0f172a;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 11px; line-height: 1.5; margin-bottom: 0;">
        If you did not request this email, you can safely ignore it. Do not share this OTP with anyone for security purposes.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"MediGrid Support" <${EMAIL_USER}>`,
        to,
        subject,
        html: htmlContent
      });
      console.log(`[EMAIL] OTP email sent successfully to ${to}`);
      return true;
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send real SMTP email to ${to}:`, err.message);
    }
  }

  // Fallback: Mock logging to Node console
  console.log('\n==================================================');
  console.log(`[MOCK EMAIL] To: ${to}`);
  console.log(`[MOCK EMAIL] Subject: ${subject}`);
  console.log(`[MOCK EMAIL] OTP: ${otp}`);
  console.log('==================================================\n');
  return true;
}

module.exports = { sendOtpEmail };
