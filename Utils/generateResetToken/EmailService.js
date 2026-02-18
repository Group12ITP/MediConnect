const nodemailer = require("nodemailer");

// ── Create reusable transporter ─────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password, NOT your real password
  },
});

/**
 * Send a welcome email after doctor registration
 * @param {string} toEmail - recipient email
 * @param {string} doctorName - full name of the doctor
 */
const sendWelcomeEmail = async (toEmail, doctorName) => {
  const mailOptions = {
    from: `"MediConnect Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to MediConnect – Registration Received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2c7be5;">Welcome, ${doctorName}!</h2>
        <p>Thank you for registering on the <strong>MediConnect Platform</strong>.</p>
        <p>Your account is currently <strong>pending admin approval</strong>. 
           You will receive another email once your account has been reviewed.</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">
          If you did not create this account, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send approval notification to doctor
 * @param {string} toEmail
 * @param {string} doctorName
 */
const sendApprovalEmail = async (toEmail, doctorName) => {
  const mailOptions = {
    from: `"Mediconnect Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your Mediconnect Account Has Been Approved!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #28a745;">Account Approved, ${doctorName}!</h2>
        <p>Your account on <strong>Mediconnect Platform</strong> has been approved by an administrator.</p>
        <p>You can now <a href="${process.env.FRONTEND_URL}/login" style="color: #2c7be5;">log in</a> 
           and start managing your profile and appointments.</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Mediconnect Platform Support Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 * @param {string} toEmail
 * @param {string} doctorName
 * @param {string} resetToken - JWT reset token
 */
const sendPasswordResetEmail = async (toEmail, doctorName, resetToken) => {
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"MediConnect Platform" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset Request – MediConnect",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #e74c3c;">Password Reset Request</h2>
        <p>Hello, ${doctorName}.</p>
        <p>We received a request to reset your password. Click the button below to proceed:</p>
        <a href="${resetURL}" 
           style="display:inline-block; padding: 10px 20px; background:#2c7be5; 
                  color:#fff; text-decoration:none; border-radius:5px; margin: 16px 0;">
          Reset Password
        </a>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">TeleMed Platform Support Team</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendApprovalEmail,
  sendPasswordResetEmail,
};
