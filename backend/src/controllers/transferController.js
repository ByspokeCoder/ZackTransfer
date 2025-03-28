const Transfer = require('../models/Transfer');
const path = require('path');
const { sendReadReceipt } = require('../services/emailService');

// Generate a random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a new transfer
exports.createTransfer = async (req, res) => {
  try {
    const content = req.body.content || req.body.text;
    const type = req.body.type;
    const email = req.body.email;
    
    console.log('Creating transfer with:', {
      hasContent: !!content,
      type,
      email,
      body: req.body
    });

    if (!content || !type) {
      return res.status(400).json({ error: 'Content and type are required' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 1 minute
    
    let transferContent = content;
    let imageUrl = null;
    
    if (type === 'image' && req.file) {
      // Create the full URL for the image
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
      transferContent = imageUrl;
    }
    
    const transfer = new Transfer({
      code,
      content: transferContent,
      type,
      imageUrl,
      expiresAt,
      senderEmail: email,
      createdAt: new Date()
    });

    await transfer.save();
    console.log('Transfer saved:', {
      code,
      type,
      hasEmail: !!email,
      senderEmail: email,
      expiresAt
    });
    
    res.status(201).json({ 
      code,
      expiresIn: 60,
      senderEmail: email
    });
  } catch (error) {
    console.error('Error creating transfer:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      mongooseError: error.name === 'ValidationError' ? error.errors : null,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Error creating transfer',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Retrieve a transfer by code
exports.getTransfer = async (req, res) => {
  try {
    const { code } = req.params;
    const transfer = await Transfer.findOne({ code });

    if (!transfer) {
      return res.status(404).json({ error: 'Transfer not found' });
    }

    if (transfer.expiresAt < new Date()) {
      return res.status(410).json({ error: 'Transfer has expired' });
    }

    console.log('Retrieved transfer:', {
      code: transfer.code,
      type: transfer.type,
      hasEmail: !!transfer.senderEmail,
      senderEmail: transfer.senderEmail,
      isRead: transfer.isRead
    });

    // Mark as read if not already read
    if (!transfer.isRead) {
      console.log('Marking transfer as read:', {
        code: transfer.code,
        email: transfer.senderEmail
      });
      transfer.isRead = true;
      transfer.readAt = new Date();
      await transfer.save();
      
      // Send read receipt email
      try {
        console.log('Attempting to send read receipt:', {
          code: transfer.code,
          email: transfer.senderEmail
        });
        await sendReadReceipt(transfer);
        console.log('Read receipt sent successfully');
      } catch (emailError) {
        console.error('Error sending read receipt:', emailError);
      }
    }

    // Always include senderEmail in the response
    const response = {
      code: transfer.code,
      content: transfer.content,
      type: transfer.type,
      imageUrl: transfer.imageUrl,
      createdAt: transfer.createdAt,
      senderEmail: transfer.senderEmail || null // Ensure senderEmail is always included
    };

    console.log('Sending response:', {
      ...response,
      content: response.content ? '[REDACTED]' : null
    });

    res.json(response);
  } catch (error) {
    console.error('Error retrieving transfer:', error);
    res.status(500).json({ error: 'Error retrieving transfer' });
  }
}; 