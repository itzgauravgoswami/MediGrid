const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

// ─── GET /api/tasks ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userEmail = (req.headers['x-user-email'] || req.query.email || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }

    const tasks = await Task.find({ userEmail }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      tasks
    });
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch health tasks.' });
  }
});

// ─── POST /api/tasks ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const userEmail = (req.headers['x-user-email'] || req.body.userEmail || '').toLowerCase().trim();
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required.' });
    }
    const text = sanitize(req.body.text || '');
    const priority = ['high', 'medium', 'low'].includes(req.body.priority) ? req.body.priority : 'medium';

    if (!text) {
      return res.status(400).json({ error: 'Task text is required.' });
    }

    const newTask = new Task({
      userEmail,
      text,
      priority,
      done: false
    });
    await newTask.save();

    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

// ─── PUT /api/tasks/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { done, text, priority } = req.body;

    const updates = {};
    if (done !== undefined) updates.done = Boolean(done);
    if (text) updates.text = sanitize(text);
    if (priority) updates.priority = priority;

    const updatedTask = await Task.findByIdAndUpdate(taskId, { $set: updates }, { new: true });

    res.status(200).json({
      success: true,
      task: updatedTask
    });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// ─── DELETE /api/tasks/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
