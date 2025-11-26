# Netyark Mall Admin & Inventory Management System

A complete, professional, and modern admin dashboard system for Netyark Mall built with React, Node.js, Express, and MongoDB.

## Features

### 🏪 Product Management
- Add, edit, and delete products
- Upload multiple product images
- Set pricing, discounts, and categories
- Product visibility and featured status controls
- Advanced search and filtering

### 📦 Inventory Management
- Real-time stock tracking
- Automatic stock reduction on orders
- Manual stock adjustments (restock/reduce)
- Low stock alerts and notifications
- Comprehensive inventory logs

### 📋 Order Management
- View and manage all customer orders
- Update order status (pending → processing → shipped → delivered)
- Payment status tracking
- Customer information management
- Order export functionality

### 🏷️ Category Management
- Create and manage product categories
- Category images and descriptions
- Product count tracking per category

### 📊 Dashboard Analytics
- Sales overview with charts
- Key metrics (total sales, orders, products, customers)
- Low stock notifications
- Recent activity tracking
- Order status distribution

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Super Admin, Staff)
- Secure password hashing
- Session management

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Toast notifications
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Icons** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Express Validator** - Input validation

## 🚀 Deployment

### Railway (Recommended - One-Click Deploy)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/your-username/netyark-mall-aims)

**One-click deployment with Railway!** See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

### Local Development

#### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd netyark-mall-aims
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and JWT secret
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

#### Initial Setup
- Visit http://localhost:3000/setup to create the first admin account
- Login with your admin credentials
- Start managing your store!

## API Documentation

### Authentication Endpoints
- `POST /api/auth/setup` - Create initial admin
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current admin info
- `PUT /api/auth/update-profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Product Endpoints
- `GET /api/products` - Get all products (with filtering)
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/products/:id/toggle-visibility` - Toggle visibility
- `PUT /api/products/:id/toggle-featured` - Toggle featured status

### Category Endpoints
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Order Endpoints
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/payment-status` - Update payment status

### Inventory Endpoints
- `GET /api/inventory` - Get inventory overview
- `GET /api/inventory/logs` - Get inventory logs
- `POST /api/inventory/restock` - Restock product
- `POST /api/inventory/reduce` - Reduce stock
- `POST /api/inventory/adjust` - Adjust stock level

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/sales-chart` - Get sales chart data
- `GET /api/dashboard/recent-orders` - Get recent orders
- `GET /api/dashboard/top-products` - Get top selling products

## Database Schema

### Collections
- **admins** - Admin users
- **products** - Product catalog
- **categories** - Product categories
- **orders** - Customer orders
- **inventory_logs** - Stock movement history

## Environment Variables

### Railway Deployment
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=C7ufTUj9r5jOxGHbITHPoTvlh3kVXvNYwN49cJMZOEQ
JWT_EXPIRE=7d
NODE_ENV=production
PORT=5000
```

### Local Development (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/netyark_mall
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

## Project Structure

```
netyark-mall-aims/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── package.json
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── railway.json          # Railway configuration
├── nixpacks.toml         # Railway build configuration
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── DEPLOYMENT.md        # Detailed deployment guide
├── package.json         # Root package.json for Railway
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.