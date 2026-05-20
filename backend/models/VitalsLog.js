const mongoose = require('mongoose');

const VitalsLogSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  date: {
    type: String, // e.g. 'Mon', 'Tue', '2026-07-21'
    required: true
  },
  sugar: {
    type: Number,
    default: 95
  },
  bpSystolic: {
    type: Number,
    default: 118
  },
  bpDiastolic: {
    type: Number,
    default: 78
  },
  heartRate: {
    type: Number,
    default: 76
  },
  weight: {
    type: Number,
    default: 68.5
  },
  waterIntakeLiters: {
    type: Number,
    default: 2.8
  },
  sleepHours: {
    type: Number,
    default: 7.5
  },
  steps: {
    type: Number,
    default: 9500
  },
  calories: {
    type: Number,
    default: 2050
  },
  workoutMins: {
    type: Number,
    default: 45
  },
  mood: {
    type: String,
    default: 'Energetic'
  },
  notes: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('VitalsLog', VitalsLogSchema);
