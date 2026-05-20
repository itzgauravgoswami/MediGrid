const mongoose = require('mongoose');

const ConnectedProviderSchema = new mongoose.Schema({
  provider: { type: String, required: true },
  providerId: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: ''
  },
  authProvider: {
    type: String,
    default: 'email'
  },
  providerId: {
    type: String,
    default: ''
  },
  connectedProviders: [ConnectedProviderSchema],
  fullName: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    default: 'patient'
  },
  // ── Profile fields — all empty by default until user fills them in ──
  phone: {
    type: String,
    default: ''
  },
  emergencyName: {
    type: String,
    default: ''
  },
  emergencyPhone: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    default: null
  },
  gender: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    default: ''
  },
  heightCm: {
    type: Number,
    default: null
  },
  weightKg: {
    type: Number,
    default: null
  },
  allergies: {
    type: String,
    default: ''
  },
  medicalConditions: {
    type: String,
    default: ''
  },
  currentMedicines: {
    type: String,
    default: ''
  },
  settings: {
    autoSync: { type: Boolean, default: true },
    smsWarnings: { type: Boolean, default: true },
    emailForwarding: { type: Boolean, default: false },
    anomalyScan: { type: Boolean, default: true }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

