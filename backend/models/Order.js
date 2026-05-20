const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    required: true
  },
  items: [{
    id: { type: String },
    name: { type: String },
    qty: { type: Number },
    price: { type: Number },
    category: { type: String }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  savings: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  deliveryEta: {
    type: String,
    default: '25 Minutes (MediGrid Quick)'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
