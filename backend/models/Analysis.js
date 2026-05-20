const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  reportType: {
    type: String,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['Green', 'Yellow', 'Red'],
    default: 'Green'
  },
  summary: {
    type: String,
    required: true
  },
  structuredData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  chatHistory: [
    {
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
