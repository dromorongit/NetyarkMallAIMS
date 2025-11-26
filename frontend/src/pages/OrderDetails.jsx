import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi'
import { format } from 'date-fns'

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
  }, [id])

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`/api/orders/${id}`)
      setOrder(response.data.data)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order details')
      navigate('/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`/api/orders/${id}/status`, { status: newStatus })
      toast.success('Order status updated successfully')
      fetchOrder()
    } catch (error) {
      toast.error('Failed to update order status')
    }
  }

  const handlePaymentStatusChange = async (newPaymentStatus) => {
    try {
      await axios.put(`/api/orders/${id}/payment-status`, { paymentStatus: newPaymentStatus })
      toast.success('Payment status updated successfully')
      fetchOrder()
    } catch (error) {
      toast.error('Failed to update payment status')
    }
  }

  const printOrder = () => {
    window.print()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-info',
      delivered: 'badge-success',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    }
    return statusConfig[status] || 'badge-gray'
  }

  const getPaymentBadge = (status) => {
    const statusConfig = {
      pending: 'badge-warning',
      paid: 'badge-success',
      failed: 'badge-danger',
      refunded: 'badge-info'
    }
    return statusConfig[status] || 'badge-gray'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => navigate('/orders')} className="btn btn-primary mt-4">
          Back to Orders
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-secondary"
          >
            <HiOutlineArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-gray-600">Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')}</p>
          </div>
        </div>
        <button onClick={printOrder} className="btn btn-secondary">
          <HiOutlinePrinter className="w-5 h-5 mr-2" />
          Print Order
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="card-title">Order Items</h3>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-4 border-b border-gray-200 last:border-b-0">
                  <img
                    src={item.image || '/placeholder-product.png'}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${order.tax?.toFixed(2)}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping:</span>
                    <span>${order.shippingCost?.toFixed(2)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${order.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>${order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status History */}
          <div className="card">
            <h3 className="card-title">Status History</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((history, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 capitalize">{history.status}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(history.date), 'MMM dd, yyyy hh:mm a')}
                    </p>
                    {history.note && (
                      <p className="text-sm text-gray-500">{history.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Status Updates */}
          <div className="card">
            <h3 className="card-title">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Order Status</label>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="label">Payment Status</label>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  className="input"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="card">
            <h3 className="card-title">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Name</p>
                <p className="text-sm text-gray-900">{order.customer?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-900">{order.customer?.email}</p>
              </div>
              {order.customer?.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-sm text-gray-900">{order.customer.phone}</p>
                </div>
              )}
              {order.customer?.address && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <div className="text-sm text-gray-900">
                    <p>{order.customer.address.street}</p>
                    <p>{order.customer.address.city}, {order.customer.address.state} {order.customer.address.zipCode}</p>
                    <p>{order.customer.address.country}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Information */}
          <div className="card">
            <h3 className="card-title">Order Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Order Number:</span>
                <span className="text-sm text-gray-900">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Status:</span>
                <span className={`badge ${getStatusBadge(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Payment:</span>
                <span className={`badge ${getPaymentBadge(order.paymentStatus)}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                <span className="text-sm text-gray-900 capitalize">
                  {order.paymentMethod?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Order Date:</span>
                <span className="text-sm text-gray-900">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy hh:mm a')}
                </span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="card">
              <h3 className="card-title">Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetails