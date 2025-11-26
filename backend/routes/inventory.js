const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/inventory
// @desc    Get inventory overview
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    
    const stockStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' },
          avgStock: { $avg: '$stock' },
          minStock: { $min: '$stock' },
          maxStock: { $max: '$stock' }
        }
      }
    ]);

    const lowStockCount = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    const outOfStockCount = await Product.countDocuments({ stock: 0 });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalStock: stockStats[0]?.totalStock || 0,
        avgStock: Math.round(stockStats[0]?.avgStock || 0),
        minStock: stockStats[0]?.minStock || 0,
        maxStock: stockStats[0]?.maxStock || 0,
        lowStockCount,
        outOfStockCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory overview',
      error: error.message
    });
  }
});

// @route   GET /api/inventory/logs
// @desc    Get inventory logs with filtering and pagination
// @access  Private
router.get('/logs', protect, async (req, res) => {
  try {
    const {
      product,
      changeType,
      admin,
      startDate,
      endDate,
      sort = '-createdAt',
      page = 1,
      limit = 20
    } = req.query;

    let query = {};

    if (product) {
      query.product = product;
    }

    if (changeType) {
      query.changeType = changeType;
    }

    if (admin) {
      query.admin = admin;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await InventoryLog.find(query)
      .populate('product', 'name sku images')
      .populate('admin', 'name username')
      .populate('order', 'orderNumber')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await InventoryLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory logs',
      error: error.message
    });
  }
});

// @route   GET /api/inventory/product/:productId
// @desc    Get inventory logs for a specific product
// @access  Private
router.get('/product/:productId', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const logs = await InventoryLog.find({ product: req.params.productId })
      .populate('admin', 'name username')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .limit(50);

    res.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        currentStock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        isLowStock: product.stock <= product.lowStockThreshold
      },
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product inventory logs',
      error: error.message
    });
  }
});

// @route   POST /api/inventory/restock
// @desc    Restock a product
// @access  Private
router.post('/restock', [
  protect,
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { productId, quantity, reason, notes } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousStock = product.stock;
    product.stock += parseInt(quantity);
    await product.save();

    // Create inventory log
    await InventoryLog.create({
      product: product._id,
      changeType: 'restock',
      quantity: parseInt(quantity),
      previousStock,
      newStock: product.stock,
      admin: req.admin._id,
      reason,
      notes
    });

    res.json({
      success: true,
      message: 'Product restocked successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          previousStock,
          newStock: product.stock,
          quantityAdded: parseInt(quantity)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error restocking product',
      error: error.message
    });
  }
});

// @route   POST /api/inventory/reduce
// @desc    Reduce product stock
// @access  Private
router.post('/reduce', [
  protect,
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
  body('reason').isIn(['damage', 'adjustment', 'return', 'other']).withMessage('Valid reason is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { productId, quantity, reason, notes } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (product.stock < parseInt(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce stock by ${quantity}. Current stock is ${product.stock}`
      });
    }

    const previousStock = product.stock;
    product.stock -= parseInt(quantity);
    await product.save();

    // Create inventory log
    await InventoryLog.create({
      product: product._id,
      changeType: reason === 'other' ? 'adjustment' : reason,
      quantity: -parseInt(quantity),
      previousStock,
      newStock: product.stock,
      admin: req.admin._id,
      reason,
      notes
    });

    res.json({
      success: true,
      message: 'Product stock reduced successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          previousStock,
          newStock: product.stock,
          quantityReduced: parseInt(quantity)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reducing product stock',
      error: error.message
    });
  }
});

// @route   POST /api/inventory/adjust
// @desc    Set product stock to specific value
// @access  Private
router.post('/adjust', [
  protect,
  body('productId').notEmpty().withMessage('Product ID is required'),
  body('newStock').isInt({ min: 0 }).withMessage('New stock must be a non-negative integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { productId, newStock, reason, notes } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const previousStock = product.stock;
    const quantityChange = parseInt(newStock) - previousStock;
    product.stock = parseInt(newStock);
    await product.save();

    // Create inventory log
    await InventoryLog.create({
      product: product._id,
      changeType: 'adjustment',
      quantity: quantityChange,
      previousStock,
      newStock: product.stock,
      admin: req.admin._id,
      reason: reason || 'Manual stock adjustment',
      notes
    });

    res.json({
      success: true,
      message: 'Product stock adjusted successfully',
      data: {
        product: {
          id: product._id,
          name: product.name,
          previousStock,
          newStock: product.stock,
          quantityChange
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adjusting product stock',
      error: error.message
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get all products with low stock
// @access  Private
router.get('/low-stock', protect, async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
      .populate('category', 'name')
      .sort({ stock: 1 });

    res.json({
      success: true,
      count: products.length,
      data: products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name,
        currentStock: p.stock,
        threshold: p.lowStockThreshold,
        image: p.images[0]
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
});

// @route   GET /api/inventory/out-of-stock
// @desc    Get all out of stock products
// @access  Private
router.get('/out-of-stock', protect, async (req, res) => {
  try {
    const products = await Product.find({ stock: 0 })
      .populate('category', 'name')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products.map(p => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name,
        image: p.images[0],
        lastUpdated: p.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching out of stock products',
      error: error.message
    });
  }
});

// @route   PUT /api/inventory/threshold/:productId
// @desc    Update low stock threshold for a product
// @access  Private
router.put('/threshold/:productId', [
  protect,
  body('threshold').isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { threshold } = req.body;

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.lowStockThreshold = parseInt(threshold);
    await product.save();

    res.json({
      success: true,
      message: 'Low stock threshold updated successfully',
      data: {
        id: product._id,
        name: product.name,
        lowStockThreshold: product.lowStockThreshold,
        currentStock: product.stock,
        isLowStock: product.stock <= product.lowStockThreshold
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating low stock threshold',
      error: error.message
    });
  }
});

module.exports = router;