const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
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

// @route   GET /api/orders
// @desc    Get all orders with filtering, sorting, and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      search,
      status,
      paymentStatus,
      startDate,
      endDate,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    let query = {};

    // Search by order number or customer name/email
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// @route   GET /api/orders/stats
// @desc    Get order statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order statistics',
      error: error.message
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', [
  protect,
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('customer.name').trim().notEmpty().withMessage('Customer name is required'),
  body('customer.email').isEmail().withMessage('Valid customer email is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const {
      items,
      customer,
      paymentMethod,
      shippingCost,
      tax,
      discount,
      notes
    } = req.body;

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product}`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}`
        });
      }

      const itemPrice = product.discountedPrice || product.price;
      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      processedItems.push({
        product: product._id,
        name: product.name,
        price: itemPrice,
        quantity: item.quantity,
        image: product.images[0] || null
      });

      // Reduce stock
      const previousStock = product.stock;
      product.stock -= item.quantity;
      await product.save();

      // Create inventory log
      await InventoryLog.create({
        product: product._id,
        changeType: 'sale',
        quantity: -item.quantity,
        previousStock,
        newStock: product.stock,
        admin: req.admin._id,
        notes: 'Stock reduced due to order'
      });
    }

    const totalAmount = subtotal + (shippingCost || 0) + (tax || 0) - (discount || 0);

    const order = await Order.create({
      items: processedItems,
      customer,
      paymentMethod: paymentMethod || 'credit_card',
      subtotal,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', [
  protect,
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { status, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Handle cancellation - restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const previousStock = product.stock;
          product.stock += item.quantity;
          await product.save();

          // Create inventory log for stock restoration
          await InventoryLog.create({
            product: product._id,
            changeType: 'return',
            quantity: item.quantity,
            previousStock,
            newStock: product.stock,
            admin: req.admin._id,
            order: order._id,
            notes: 'Stock restored due to order cancellation'
          });
        }
      }
    }

    order.status = status;
    if (note) {
      order.statusHistory[order.statusHistory.length - 1].note = note;
    }
    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
});

// @route   PUT /api/orders/:id/payment-status
// @desc    Update order payment status
// @access  Private
router.put('/:id/payment-status', [
  protect,
  body('paymentStatus').isIn(['pending', 'paid', 'failed', 'refunded'])
    .withMessage('Invalid payment status'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating payment status',
      error: error.message
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private (Super Admin only)
router.delete('/:id', protect, authorize('super_admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deletion of cancelled orders
    if (order.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be deleted'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting order',
      error: error.message
    });
  }
});

// @route   GET /api/orders/export
// @desc    Export orders as JSON
// @access  Private
router.get('/export/json', protect, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name sku')
      .sort('-createdAt');

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting orders',
      error: error.message
    });
  }
});

module.exports = router;