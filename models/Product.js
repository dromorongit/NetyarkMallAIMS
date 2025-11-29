const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  longDescription: { type: String },
  brand: { type: String },
  colors: { type: [String] }, // array of colors
  sizes: { type: [String] }, // array of sizes
  price: { type: Number, required: true }, // in GHS
  stock: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  image: { type: String }, // URL or path
  additionalMedia: { type: [String] }, // array of additional media paths (images/videos)
  isWholesale: { type: Boolean, default: false },
  minOrderQty: { type: Number, default: 1 },
  isNewArrival: { type: Boolean, default: false },
  isFastSelling: { type: Boolean, default: false },
  isShopByCategory: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);