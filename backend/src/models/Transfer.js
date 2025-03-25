const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6
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
    default: Date.now,
    expires: 86400 // Document will be automatically deleted after 24 hours
  },
  used: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Transfer', transferSchema); 