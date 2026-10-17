
const nodemailer = require('nodemailer');
const config = require('../config/config');

const transport = nodemailer.createTransport({
  ...config.email.smtp,
  host: config.email.smtp.host,
  port: Number(config.email.smtp.port),
  secure: Number(config.email.smtp.port) === 465,
  auth: {
    user: config.email.smtp.auth.user?.trim(),
    pass: config.email.smtp.auth.pass?.replace(/\s/g, ''),
  },
});

if (config.env !== 'test') {
  console.log('SMTP configuration:', {
    host: config.email.smtp.host,
    port: Number(config.email.smtp.port),
    username: config.email.smtp.auth.user,
    passwordLoaded: Boolean(config.email.smtp.auth.pass),
    passwordLength: config.email.smtp.auth.pass?.replace(/\s/g, '').length,
  });

  transport.verify()
    .then(() => console.log('Connected to email server'))
    .catch((error) => {
      console.error('SMTP verification failed:', {
        code: error.code,
        responseCode: error.responseCode,
        message: error.message,
      });
    });
}


/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 */
const sendEmail = async (to, subject, text, html) => {
  const msg = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 */
const sendResetPasswordEmail = async (to, resetUrl) => {
  const subject = 'Reset your password';
  const text = `Click the following link to reset your password: ${resetUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Reset your password</h2>
      <p>You requested to reset your password. Click the button below:</p>
      <a href="${resetUrl}"
         style="display: inline-block; background: #4F46E5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
        Reset Password
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">
        Or copy this link into your browser:<br>
        <span style="word-break: break-all;">${resetUrl}</span>
      </p>
      <p style="margin-top: 20px; color: #999; font-size: 12px;">
        This link expires in 10 minutes. If you didn't request this, ignore this email.
      </p>
    </div>
  `;
  await sendEmail(to, subject, text, html);
};

module.exports = {
  transport,
  sendEmail,
  sendResetPasswordEmail,
};