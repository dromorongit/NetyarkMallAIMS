const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // could be user id or 'admin'
  message: { type: String, required: true },
  response: { type: String }, // admin response
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', messageSchema);