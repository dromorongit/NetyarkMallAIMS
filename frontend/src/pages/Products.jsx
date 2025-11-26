import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlinePencil,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineStar,
  HiOutlineTrash
} from 'react-icons/hi'

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [search, categoryFilter, statusFilter, currentPage])

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      })

      if (search) params.append('search', search)
      if (categoryFilter) params.append('category', categoryFilter)
      if (statusFilter) params.append('isVisible', statusFilter)

      const response = await axios.get(`/api/products?${params}`)
      setProducts(response.data.data)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories')
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleToggleVisibility = async (productId, currentVisibility) => {
    try {
      await axios.put(`/api/products/${productId}/toggle-visibility`)
      toast.success(`Product ${currentVisibility ? 'hidden' : 'visible'} successfully`)
      fetchProducts()
    } catch (error) {
      toast.error('Failed to update product visibility')
    }
  }

  const handleToggleFeatured = async (productId, currentFeatured) => {
    try {
      await axios.put(`/api/products/${productId}/toggle-featured`)
      toast.success(`Product ${currentFeatured ? 'removed from' : 'marked as'} featured`)
      fetchProducts()
    } catch (error) {
      toast.error('Failed to update product featured status')
    }
  }

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      return
    }

    try {
      await axios.delete(`/api/products/${productId}`)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const getStockStatus = (stock, lowStockThreshold) => {
    if (stock === 0) return { text: 'Out of Stock', class: 'badge-danger' }
    if (stock <= lowStockThreshold) return { text: 'Low Stock', class: 'badge-warning' }
    return { text: 'In Stock', class: 'badge-success' }
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
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link to="/products/new" className="btn btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Search</label>
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search products..."
              />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="true">Visible</option>
              <option value="false">Hidden</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('')
                setCategoryFilter('')
                setStatusFilter('')
                setCurrentPage(1)
              }}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? (
                products.map((product) => {
                  const stockStatus = getStockStatus(product.stock, product.lowStockThreshold)
                  return (
                    <tr key={product._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images?.[0] || '/placeholder-product.png'}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">
                          {product.category?.name || 'No Category'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">${product.discountedPrice?.toFixed(2) || product.price?.toFixed(2)}</p>
                          {product.discount > 0 && (
                            <p className="text-sm text-gray-500 line-through">${product.price?.toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${stockStatus.class}`}>
                          {product.stock} ({stockStatus.text})
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {product.isVisible ? (
                            <HiOutlineEye className="w-5 h-5 text-green-600" />
                          ) : (
                            <HiOutlineEyeOff className="w-5 h-5 text-gray-400" />
                          )}
                          {product.featured && (
                            <HiOutlineStar className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/products/${product._id}/edit`}
                            className="btn btn-sm btn-secondary"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleVisibility(product._id, product.isVisible)}
                            className={`btn btn-sm ${product.isVisible ? 'btn-secondary' : 'btn-success'}`}
                          >
                            {product.isVisible ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(product._id, product.featured)}
                            className={`btn btn-sm ${product.featured ? 'btn-warning' : 'btn-secondary'}`}
                          >
                            <HiOutlineStar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            className="btn btn-sm btn-danger"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Products