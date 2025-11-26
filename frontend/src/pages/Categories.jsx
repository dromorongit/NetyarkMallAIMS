import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff
} from 'react-icons/hi'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories')
      setCategories(response.data.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'image' && files) {
      setFormData(prev => ({ ...prev, image: files[0] }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      if (formData.description) submitData.append('description', formData.description)
      if (formData.image) submitData.append('image', formData.image)

      if (editingCategory) {
        await axios.put(`/api/categories/${editingCategory._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Category updated successfully')
      } else {
        await axios.post('/api/categories', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Category created successfully')
      }

      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', description: '', image: null })
      fetchCategories()
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save category'
      toast.error(message)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      image: null
    })
    setShowModal(true)
  }

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return
    }

    try {
      await axios.delete(`/api/categories/${categoryId}`)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      await axios.put(`/api/categories/${categoryId}/toggle-status`)
      toast.success(`Category ${currentStatus ? 'deactivated' : 'activated'} successfully`)
      fetchCategories()
    } catch (error) {
      toast.error('Failed to update category status')
    }
  }

  const openModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '', image: null })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '', image: null })
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
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button onClick={openModal} className="btn btn-primary">
          <HiOutlinePlus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.length > 0 ? (
          categories.map((category) => (
            <div key={category._id} className="card">
              <div className="flex items-start gap-4">
                <img
                  src={category.image || '/placeholder-category.png'}
                  alt={category.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{category.name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {category.description || 'No description'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="badge badge-info">
                      {category.productCount || 0} products
                    </span>
                    <span className={`badge ${category.isActive ? 'badge-success' : 'badge-gray'}`}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(category._id, category.isActive)}
                    className={`btn btn-sm ${category.isActive ? 'btn-secondary' : 'btn-success'}`}
                  >
                    {category.isActive ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="btn btn-sm btn-secondary"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id, category.name)}
                    className="btn btn-sm btn-danger"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No categories found</p>
            <button onClick={openModal} className="btn btn-primary mt-4">
              Create your first category
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="label">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="label">Category Image</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleInputChange}
                  accept="image/*"
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Recommended size: 400x400px
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories