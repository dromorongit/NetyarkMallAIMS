const express = require('express');
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = express.Router();

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get new arrivals (public)
router.get('/new-arrivals', async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get fast-selling items (public)
router.get('/fast-selling', async (req, res) => {
  try {
    const products = await Product.find({ isFastSelling: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get shop by category items (public)
router.get('/shop-by-category', async (req, res) => {
  try {
    const products = await Product.find({ isShopByCategory: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get wholesale products (public)
router.get('/wholesale', async (req, res) => {
  try {
    const products = await Product.find({ isWholesale: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get product by id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create product (admin only)
router.post('/', auth, adminAuth, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'additionalMedia', maxCount: 10 }
]), async (req, res) => {
  const productData = req.body;
  if (req.files.image && req.files.image[0]) {
    productData.image = '/uploads/' + req.files.image[0].filename;
  }
  if (req.files.additionalMedia) {
    productData.additionalMedia = req.files.additionalMedia.map(file => '/uploads/' + file.filename);
  }
  const product = new Product(productData);
  try {
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update product
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete product
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update stock
router.patch('/:id/stock', auth, adminAuth, async (req, res) => {
  try {
    const { stock } = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;