import nodemailer from 'nodemailer';
import { ITransfer } from '../models/Transfer';

console.log('Email configuration:', {
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD ? '****' : 'not set'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify email configuration on startup
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email configuration error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendReadReceipt = async (transfer: ITransfer) => {
  console.log('Starting sendReadReceipt for transfer:', transfer.code);
  
  if (!transfer.senderEmail) {
    console.log('No sender email provided, skipping read receipt');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: transfer.senderEmail,
    subject: 'Your ZackTransfer has been read',
    html: `
      <h2>Your transfer has been read!</h2>
      <p>Your transfer with code <strong>${transfer.code}</strong> has been viewed by the recipient.</p>
      <p>Content type: ${transfer.type}</p>
      <p>Read at: ${transfer.readAt?.toLocaleString()}</p>
    `
  };

  console.log('Sending email with options:', {
    ...mailOptions,
    from: process.env.EMAIL_USER
  });

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending read receipt email:', error);
    throw error;
  }
}; 