const express = require('express');
const Message = require('../models/Message');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all messages (admin)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send message (user or public)
router.post('/', async (req, res) => {
  const { sender, message } = req.body;
  const newMessage = new Message({ sender, message });
  try {
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Respond to message (admin)
router.patch('/:id/respond', auth, adminAuth, async (req, res) => {
  try {
    const { response } = req.body;
    const message = await Message.findByIdAndUpdate(req.params.id, { response, isRead: true }, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;