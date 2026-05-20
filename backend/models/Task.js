const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  done: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
