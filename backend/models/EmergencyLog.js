const mongoose = require('mongoose');

const EmergencyLogSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
    trim: true,
    lowercase: true
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String, default: '' },
    accuracy: { type: Number }
  },
  symptoms: {
    type: String,
    default: ''
  },
  urgencyLevel: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  assessmentSummary: {
    type: String,
    default: ''
  },
  nearestHospital: {
    name: { type: String },
    distanceKm: { type: Number }
  },
  status: {
    type: String,
    enum: ['ACTIVATED', 'RESOLVED', 'CANCELLED'],
    default: 'ACTIVATED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('EmergencyLog', EmergencyLogSchema);
