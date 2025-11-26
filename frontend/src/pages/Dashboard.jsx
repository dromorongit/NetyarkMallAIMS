import { useState, useEffect } from 'react'
import axios from 'axios'
import {
  HiOutlineShoppingBag,
  HiOutlineClipboardList,
  HiOutlineTag,
  HiOutlineUsers,
  HiOutlineCurrencyDollar,
  HiOutlineExclamationTriangle
} from 'react-icons/hi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStockAlerts, setLowStockAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [
        statsRes,
        salesRes,
        ordersRes,
        productsRes,
        alertsRes
      ] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/dashboard/sales-chart'),
        axios.get('/api/dashboard/recent-orders'),
        axios.get('/api/dashboard/top-products'),
        axios.get('/api/dashboard/low-stock-alerts')
      ])

      setStats(statsRes.data.data)
      setSalesData(salesRes.data.data)
      setRecentOrders(ordersRes.data.data)
      setTopProducts(productsRes.data.data)
      setLowStockAlerts(alertsRes.data.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats?.totalProducts || 0,
      icon: HiOutlineShoppingBag,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: HiOutlineClipboardList,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Categories',
      value: stats?.totalCategories || 0,
      icon: HiOutlineTag,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Total Customers',
      value: stats?.totalCustomers || 0,
      icon: HiOutlineUsers,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Total Revenue',
      value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: HiOutlineCurrencyDollar,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      title: 'Low Stock Alerts',
      value: stats?.lowStockProducts || 0,
      icon: HiOutlineExclamationTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ]

  const orderStatusColors = {
    pending: '#F59E0B',
    processing: '#3B82F6',
    shipped: '#8B5CF6',
    delivered: '#10B981',
    completed: '#059669',
    cancelled: '#EF4444'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sales Overview</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#1A73E8"
                  strokeWidth={2}
                  dot={{ fill: '#1A73E8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Order Status</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pending', value: stats?.pendingOrders || 0, color: orderStatusColors.pending },
                    { name: 'Processing', value: stats?.processingOrders || 0, color: orderStatusColors.processing },
                    { name: 'Completed', value: stats?.completedOrders || 0, color: orderStatusColors.completed },
                    { name: 'Cancelled', value: stats?.cancelledOrders || 0, color: orderStatusColors.cancelled }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {[
                    { name: 'Pending', value: stats?.pendingOrders || 0, color: orderStatusColors.pending },
                    { name: 'Processing', value: stats?.processingOrders || 0, color: orderStatusColors.processing },
                    { name: 'Completed', value: stats?.completedOrders || 0, color: orderStatusColors.completed },
                    { name: 'Cancelled', value: stats?.cancelledOrders || 0, color: orderStatusColors.cancelled }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Orders</h3>
          </div>
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${order.totalAmount?.toFixed(2)}</p>
                    <span className={`badge ${
                      order.status === 'completed' ? 'badge-success' :
                      order.status === 'pending' ? 'badge-warning' :
                      order.status === 'cancelled' ? 'badge-danger' : 'badge-info'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
          </div>
          <div className="space-y-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product._id || index} className="flex items-center gap-4">
                  <img
                    src={product.image || '/placeholder-product.png'}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.totalSold} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${product.totalRevenue?.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Low Stock Alerts</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockAlerts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
                <img
                  src={product.image || '/placeholder-product.png'}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-red-600">
                    {product.stock} remaining (threshold: {product.threshold})
                  </p>
                  {product.category && (
                    <p className="text-xs text-gray-500">{product.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard