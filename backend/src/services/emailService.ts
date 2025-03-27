import nodemailer from 'nodemailer';
import { ITransfer } from '../models/Transfer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendReadReceipt = async (transfer: ITransfer) => {
  if (!transfer.senderEmail) return;

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

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending read receipt email:', error);
  }
}; 