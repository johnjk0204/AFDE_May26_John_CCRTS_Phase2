const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SKIPPED] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.sendPasswordResetEmail = (to, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail(to, 'Password Reset Request', `
    <h2>Hello ${name},</h2>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="background:#4F46E5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Reset Password</a>
    <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
  `);
};

exports.sendComplaintCreatedEmail = (to, name, complaintNumber, priority) => {
  return sendEmail(to, `Complaint Registered - ${complaintNumber}`, `
    <h2>Hello ${name},</h2>
    <p>Your complaint has been successfully registered.</p>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Complaint Number</strong></td><td style="padding:8px;border:1px solid #ddd">${complaintNumber}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Priority</strong></td><td style="padding:8px;border:1px solid #ddd">${priority}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd"><strong>Status</strong></td><td style="padding:8px;border:1px solid #ddd">Open</td></tr>
    </table>
    <p>You will be notified as your complaint progresses. Thank you for reaching out.</p>
  `);
};

exports.sendStatusUpdateEmail = (to, name, complaintNumber, newStatus) => {
  return sendEmail(to, `Complaint Update - ${complaintNumber}`, `
    <h2>Hello ${name},</h2>
    <p>Your complaint <strong>${complaintNumber}</strong> has been updated.</p>
    <p><strong>New Status:</strong> ${newStatus}</p>
    <p>Log in to your account to view full details and provide any additional information.</p>
  `);
};

exports.sendResolutionEmail = (to, name, complaintNumber) => {
  const loginUrl = `${process.env.CLIENT_URL}/login`;
  return sendEmail(to, `Complaint Resolved - ${complaintNumber}`, `
    <h2>Hello ${name},</h2>
    <p>Your complaint <strong>${complaintNumber}</strong> has been resolved.</p>
    <p>Please <a href="${loginUrl}">log in</a> to review the resolution and provide feedback.</p>
    <p>Your feedback helps us improve our service quality.</p>
  `);
};

exports.sendEscalationEmail = (to, name, complaintNumber) => {
  return sendEmail(to, `Complaint Escalated - ${complaintNumber}`, `
    <h2>Hello ${name},</h2>
    <p>Your complaint <strong>${complaintNumber}</strong> has been escalated to our supervisor team for urgent attention.</p>
    <p>We apologize for the delay and are committed to resolving this as soon as possible.</p>
  `);
};
