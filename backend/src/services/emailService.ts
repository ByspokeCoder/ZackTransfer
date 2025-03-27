import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ITransfer } from '../models/Transfer';

const isProduction = process.env.NODE_ENV === 'production';
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction: isProduction
});

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

async function createTransporter() {
  try {
    // Get access token
    const accessToken = await oauth2Client.getAccessToken();
    
    console.log('Email configuration:', {
      user: process.env.EMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID ? '****' : 'not set',
      clientSecret: process.env.GMAIL_CLIENT_SECRET ? '****' : 'not set',
      refreshToken: process.env.GMAIL_REFRESH_TOKEN ? '****' : 'not set',
      accessToken: accessToken ? '****' : 'not set',
      env: process.env.NODE_ENV
    });

    const transporterConfig = {
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken?.token || undefined
      }
    };

    console.log('Creating transporter with config:', {
      ...transporterConfig,
      auth: {
        ...transporterConfig.auth,
        clientId: '****',
        clientSecret: '****',
        refreshToken: '****',
        accessToken: '****'
      }
    });

    const transporter = nodemailer.createTransport(transporterConfig);

    // Verify configuration
    await transporter.verify();
    console.log('Email server is ready to send messages');
    
    return transporter;
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
}

export const sendReadReceipt = async (transfer: ITransfer) => {
  console.log('Starting sendReadReceipt for transfer:', {
    code: transfer.code,
    email: transfer.senderEmail,
    type: transfer.type,
    readAt: transfer.readAt,
    env: process.env.NODE_ENV
  });
  
  if (!transfer.senderEmail) {
    console.log('No sender email provided, skipping read receipt');
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET || !process.env.GMAIL_REFRESH_TOKEN) {
    console.error('Missing email configuration:', {
      hasUser: !!process.env.EMAIL_USER,
      hasClientId: !!process.env.GMAIL_CLIENT_ID,
      hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
      hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN
    });
    throw new Error('Email configuration is incomplete');
  }

  const mailOptions = {
    from: {
      name: 'ZackTransfer',
      address: process.env.EMAIL_USER
    },
    to: transfer.senderEmail,
    subject: 'Your ZackTransfer has been read',
    html: `
      <h2>Your transfer has been read!</h2>
      <p>Your transfer with code <strong>${transfer.code}</strong> has been viewed by the recipient.</p>
      <p>Content type: ${transfer.type}</p>
      <p>Read at: ${transfer.readAt?.toLocaleString()}</p>
    `,
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    const transporter = await createTransporter();
    
    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Full response:', JSON.stringify(info, null, 2));
    return info;
  } catch (error) {
    console.error('Error sending read receipt email. Full error:', JSON.stringify(error, null, 2));
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    // Log additional error details if available
    if (error && typeof error === 'object') {
      const emailError = error as any;
      console.error('Additional error details:', {
        code: emailError.code,
        command: emailError.command,
        responseCode: emailError.responseCode,
        response: emailError.response
      });
    }
    throw error;
  }
}; 