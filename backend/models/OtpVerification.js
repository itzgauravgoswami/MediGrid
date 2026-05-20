const mongoose = require('mongoose');

const OtpVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: function() { return this.type === 'register'; }
  },
  password: {
    type: String,
    required: function() { return this.type === 'register'; }
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['register', 'reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Ephemeral records: automatically expire when expiresAt is reached
OtpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpVerification', OtpVerificationSchema);
