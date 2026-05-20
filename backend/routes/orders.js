const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// ─── POST /api/orders/create ────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const userEmail = (req.headers['x-user-email'] || req.body.userEmail || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const { orderId, paymentId, items, totalAmount, discount, savings } = req.body;

    if (!orderId || !paymentId) {
      return res.status(400).json({ error: 'Order ID and Payment ID are required.' });
    }

    const newOrder = new Order({
      userEmail,
      orderId: sanitize(orderId),
      paymentId: sanitize(paymentId),
      items: Array.isArray(items) ? items : [],
      totalAmount: Number(totalAmount) || 0,
      discount: Number(discount) || 0,
      savings: Number(savings) || 0,
      status: 'CONFIRMED'
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order saved in database successfully.',
      order: newOrder
    });
  } catch (err) {
    console.error('Error recording order:', err);
    res.status(500).json({ error: 'Failed to record order.' });
  }
});

// ─── GET /api/orders/my-orders ──────────────────────────────────────────────
router.get('/my-orders', async (req, res) => {
  try {
    const userEmail = (req.headers['x-user-email'] || req.query.email || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(200).json({ success: true, orders: [] });
    }
    const orders = await Order.find({ userEmail }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch order history.' });
  }
});

module.exports = router;
