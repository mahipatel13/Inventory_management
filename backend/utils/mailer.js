'use strict';

const nodemailer = require('nodemailer');

const getTransport = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error('SMTP credentials missing. Set SMTP_USER and SMTP_PASS in backend .env');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  const transport = getTransport();
  return transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendMail,
};
