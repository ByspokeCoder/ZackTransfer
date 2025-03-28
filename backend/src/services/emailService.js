const nodemailer = require('nodemailer');

const isProduction = process.env.NODE_ENV === 'production';
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction: isProduction
});

async function createTransporter() {
  try {
    console.log('Email configuration:', {
      user: process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD,
      env: process.env.NODE_ENV
    });

    const transporterConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    };

    console.log('Creating transporter with config:', {
      ...transporterConfig,
      auth: {
        ...transporterConfig.auth,
        pass: '****'
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

const sendReadReceipt = async (transfer) => {
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

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('Missing email configuration:', {
      hasUser: !!process.env.EMAIL_USER,
      hasPassword: !!process.env.EMAIL_PASSWORD
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
      console.error('Additional error details:', {
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response
      });
    }
    throw error;
  }
};

module.exports = { sendReadReceipt }; 