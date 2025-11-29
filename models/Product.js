const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  longDescription: { type: String },
  brand: { type: String },
  colors: { type: [String] }, // array of colors
  price: { type: Number, required: true }, // in GHS
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  image: { type: String }, // URL or path
  isWholesale: { type: Boolean, default: false },
  minOrderQty: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);