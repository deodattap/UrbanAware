// src/utils/email.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`📧 [DEV] Email would be sent to: ${to}\nSubject: ${subject}`);
    return { messageId: 'dev-mode' };
  }
  const transporter = createTransporter();
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'UrbanAware <noreply@urbanaware.com>',
    to,
    subject,
    html
  });
};

const driveJoinConfirmation = (name, driveName, date, location) => ({
  subject: `✅ You've joined: ${driveName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
      <div style="background: linear-gradient(135deg, #22C55E, #3B82F6); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🌱 UrbanAware</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Smart Urban Sustainability Platform</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #0f172a; margin-top: 0;">Hey ${name}! 🎉</h2>
        <p style="color: #64748b; line-height: 1.6;">You've successfully registered for the following drive:</p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <h3 style="color: #16a34a; margin: 0 0 8px;">${driveName}</h3>
          <p style="margin: 4px 0; color: #374151;">📅 <strong>Date:</strong> ${date}</p>
          <p style="margin: 4px 0; color: #374151;">📍 <strong>Location:</strong> ${location}</p>
        </div>
        <p style="color: #64748b; line-height: 1.6;">Your participation earns you <strong style="color: #22C55E;">+8 Sustainability Points</strong>! Keep making a difference. 🌍</p>
        <a href="#" style="display: inline-block; background: linear-gradient(135deg, #22C55E, #3B82F6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">View Dashboard</a>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">© 2026 UrbanAware. All rights reserved.</p>
    </div>
  `
});

const reportConfirmation = (name, type, location) => ({
  subject: `📢 Issue Report Received — UrbanAware`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
      <div style="background: linear-gradient(135deg, #22C55E, #3B82F6); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🌱 UrbanAware</h1>
      </div>
      <div style="background: white; border-radius: 12px; padding: 32px;">
        <h2 style="color: #0f172a; margin-top: 0;">Report Received! ✅</h2>
        <p style="color: #64748b;">Hi ${name || 'Community Member'}, your issue report has been received.</p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #374151;">📋 <strong>Type:</strong> ${type}</p>
          <p style="margin: 4px 0; color: #374151;">📍 <strong>Location:</strong> ${location}</p>
          <p style="margin: 4px 0; color: #374151;">📌 <strong>Status:</strong> Under Review</p>
        </div>
        <p style="color: #64748b;">Our team will review this within 24 hours and forward it to relevant authorities. You've earned <strong style="color: #22C55E;">+5 Sustainability Points</strong>!</p>
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 24px;">© 2026 UrbanAware. All rights reserved.</p>
    </div>
  `
});

module.exports = { sendEmail, driveJoinConfirmation, reportConfirmation };
