import { Link, useLocation } from 'react-router-dom'
import {
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineTag,
  HiOutlineClipboardList,
  HiOutlineArchive,
  HiOutlineCog
} from 'react-icons/hi'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const location = useLocation()
  const { admin } = useAuth()

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: HiOutlineHome
    },
    {
      path: '/products',
      label: 'Products',
      icon: HiOutlineShoppingBag
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: HiOutlineTag
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: HiOutlineClipboardList
    },
    {
      path: '/inventory',
      label: 'Inventory',
      icon: HiOutlineArchive
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: HiOutlineCog
    }
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-soft border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Netyark Mall</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {admin?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {admin?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {admin?.role?.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar