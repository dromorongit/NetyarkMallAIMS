const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  changeType: {
    type: String,
    enum: ['restock', 'sale', 'adjustment', 'return', 'damage', 'initial'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  reason: {
    type: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ changeType: 1 });
inventoryLogSchema.index({ admin: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);