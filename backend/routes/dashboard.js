const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const InventoryLog = require('../models/InventoryLog');
const { protect } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    // Total counts
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Get unique customers count
    const uniqueCustomers = await Order.distinct('customer.email');
    const totalCustomers = uniqueCustomers.length;

    // Revenue calculation
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // Order status counts
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const processingOrders = await Order.countDocuments({ status: 'processing' });
    const completedOrders = await Order.countDocuments({ status: 'completed' });

    // Low stock products count
    const lowStockProducts = await Product.countDocuments({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    });

    // Out of stock products count
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        totalCategories,
        totalCustomers,
        totalRevenue,
        pendingOrders,
        processingOrders,
        completedOrders,
        lowStockProducts,
        outOfStockProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/sales-chart
// @desc    Get sales data for charts
// @access  Private
router.get('/sales-chart', protect, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;

    let dateFormat, groupBy, daysBack;

    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        daysBack = 7;
        break;
      case 'weekly':
        dateFormat = '%Y-%U';
        daysBack = 28;
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        daysBack = 365;
        break;
      default:
        dateFormat = '%Y-%m-%d';
        daysBack = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sales chart data',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/recent-orders
// @desc    Get recent orders
// @access  Private
router.get('/recent-orders', protect, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const orders = await Order.find()
      .sort('-createdAt')
      .limit(parseInt(limit))
      .select('orderNumber customer.name totalAmount status paymentStatus createdAt');

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent orders',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/top-products
// @desc    Get top selling products
// @access  Private
router.get('/top-products', protect, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get product images
    const productIds = topProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } }).select('images');
    const productImages = {};
    products.forEach(p => {
      productImages[p._id.toString()] = p.images[0];
    });

    const result = topProducts.map(p => ({
      ...p,
      image: productImages[p._id?.toString()] || null
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top products',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/low-stock-alerts
// @desc    Get low stock alerts
// @access  Private
router.get('/low-stock-alerts', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
      .populate('category', 'name')
      .sort({ stock: 1 })
      .limit(parseInt(limit))
      .select('name stock lowStockThreshold images category');

    res.json({
      success: true,
      count: products.length,
      data: products.map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        threshold: p.lowStockThreshold,
        category: p.category?.name,
        image: p.images[0],
        isOutOfStock: p.stock === 0
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock alerts',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/category-distribution
// @desc    Get product distribution by category
// @access  Private
router.get('/category-distribution', protect, async (req, res) => {
  try {
    const distribution = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          name: '$category.name',
          count: 1,
          totalStock: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category distribution',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent inventory activity
// @access  Private
router.get('/recent-activity', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const activities = await InventoryLog.find()
      .populate('product', 'name')
      .populate('admin', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: activities.map(a => ({
        id: a._id,
        product: a.product?.name,
        changeType: a.changeType,
        quantity: a.quantity,
        previousStock: a.previousStock,
        newStock: a.newStock,
        admin: a.admin?.name,
        date: a.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
});

// @route   GET /api/dashboard/order-status-distribution
// @desc    Get order status distribution
// @access  Private
router.get('/order-status-distribution', protect, async (req, res) => {
  try {
    const distribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusMap = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0
    };

    distribution.forEach(d => {
      statusMap[d._id] = d.count;
    });

    res.json({
      success: true,
      data: statusMap
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order status distribution',
      error: error.message
    });
  }
});

module.exports = router;