const Transfer = require('../models/Transfer');
const path = require('path');

// Generate a random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create a new transfer
exports.createTransfer = async (req, res) => {
  try {
    const { content, type } = req.body;
    const code = generateCode();
    
    let imageUrl = null;
    if (type === 'image' && req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const transfer = new Transfer({
      code,
      content: type === 'image' ? imageUrl : content,
      type,
      imageUrl
    });

    await transfer.save();
    res.status(201).json({ code });
  } catch (error) {
    res.status(500).json({ error: 'Error creating transfer' });
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

    if (transfer.used) {
      return res.status(400).json({ error: 'Transfer already used' });
    }

    // Mark transfer as used
    transfer.used = true;
    await transfer.save();

    res.json(transfer);
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving transfer' });
  }
}; 