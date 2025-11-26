const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const InventoryLog = require('../models/InventoryLog');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      search,
      category,
      featured,
      isVisible,
      lowStock,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Search by name, description, or tags
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by featured
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }

    // Filter by visibility
    if (isVisible !== undefined) {
      query.isVisible = isVisible === 'true';
    }

    // Filter by low stock
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

// @route   GET /api/products/low-stock
// @desc    Get products with low stock
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
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock products',
      error: error.message
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', [
  protect,
  upload.array('images', 5),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Product description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      discount,
      category,
      stock,
      tags,
      featured,
      isVisible,
      sku,
      weight,
      dimensions,
      lowStockThreshold
    } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      category,
      stock: parseInt(stock),
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      featured: featured === 'true' || featured === true,
      isVisible: isVisible !== 'false' && isVisible !== false,
      sku,
      weight: weight ? parseFloat(weight) : undefined,
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10
    };

    if (dimensions) {
      productData.dimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      productData.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const product = await Product.create(productData);

    // Update category product count
    await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });

    // Create initial inventory log
    await InventoryLog.create({
      product: product._id,
      changeType: 'initial',
      quantity: parseInt(stock),
      previousStock: 0,
      newStock: parseInt(stock),
      admin: req.admin._id,
      notes: 'Initial stock on product creation'
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', [
  protect,
  upload.array('images', 5),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  handleValidationErrors
], async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      description,
      price,
      discount,
      category,
      stock,
      tags,
      featured,
      isVisible,
      sku,
      weight,
      dimensions,
      lowStockThreshold,
      removeImages
    } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discount !== undefined) updateData.discount = parseFloat(discount);
    if (stock !== undefined) {
      const newStock = parseInt(stock);
      const previousStock = product.stock;
      
      if (newStock !== previousStock) {
        // Create inventory log for stock change
        await InventoryLog.create({
          product: product._id,
          changeType: 'adjustment',
          quantity: newStock - previousStock,
          previousStock,
          newStock,
          admin: req.admin._id,
          notes: 'Manual stock adjustment'
        });
      }
      updateData.stock = newStock;
    }
    if (tags) {
      updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    }
    if (featured !== undefined) updateData.featured = featured === 'true' || featured === true;
    if (isVisible !== undefined) updateData.isVisible = isVisible === 'true' || isVisible === true;
    if (sku !== undefined) updateData.sku = sku;
    if (weight !== undefined) updateData.weight = parseFloat(weight);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
    if (dimensions) {
      updateData.dimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
    }

    // Handle category change
    if (category && category !== product.category.toString()) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      // Update product counts
      await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });
      await Category.findByIdAndUpdate(category, { $inc: { productCount: 1 } });
      updateData.category = category;
    }

    // Handle image updates
    let currentImages = [...product.images];

    // Remove specified images
    if (removeImages) {
      const imagesToRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
      currentImages = currentImages.filter(img => !imagesToRemove.includes(img));
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      currentImages = [...currentImages, ...newImages];
    }

    updateData.images = currentImages;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Super Admin only)
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update category product count
    await Category.findByIdAndUpdate(product.category, { $inc: { productCount: -1 } });

    // Delete associated inventory logs
    await InventoryLog.deleteMany({ product: req.params.id });

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id/toggle-visibility
// @desc    Toggle product visibility
// @access  Private
router.put('/:id/toggle-visibility', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isVisible = !product.isVisible;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isVisible ? 'visible' : 'hidden'} successfully`,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling product visibility',
      error: error.message
    });
  }
});

// @route   PUT /api/products/:id/toggle-featured
// @desc    Toggle product featured status
// @access  Private
router.put('/:id/toggle-featured', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.featured = !product.featured;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.featured ? 'marked as featured' : 'removed from featured'} successfully`,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling product featured status',
      error: error.message
    });
  }
});

module.exports = router;