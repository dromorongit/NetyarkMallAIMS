require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',  // Local development
    'https://www.netyarkmall.com',  // Production frontend domain
    'https://netyarkmall.com'  // Alternative domain
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/netyarkmall').then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

const orderRoutes = require('./routes/orders');
app.use('/api/orders', orderRoutes);

const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => res.send('NetyarkMall AIMS API'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));