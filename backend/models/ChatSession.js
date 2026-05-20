const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', ChatSessionSchema);
