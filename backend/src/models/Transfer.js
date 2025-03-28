const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    required: true
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  senderEmail: {
    type: String
  }
});

module.exports = mongoose.model('Transfer', transferSchema); 