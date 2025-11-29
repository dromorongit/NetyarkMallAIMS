const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Register (customers public, staff require superadmin auth, only one superadmin allowed)
router.post('/register', async (req, res) => {
  const { name, email, password, role = 'customer' } = req.body;
  const allowedRoles = ['customer', 'staff', 'superadmin'];
  if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

  if (role === 'superadmin') {
    const existingSuper = await User.findOne({ role: 'superadmin' });
    if (existingSuper) return res.status(400).json({ message: 'Super admin already exists' });
  } else if (role !== 'customer') {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Auth required for staff accounts' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user.role !== 'superadmin') return res.status(403).json({ message: 'Only superadmin can create staff accounts' });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Check if superadmin exists
router.get('/check-superadmin', async (req, res) => {
  try {
    const superadmin = await User.findOne({ role: 'superadmin' });
    res.json({ exists: !!superadmin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get profile
router.get('/profile', auth, (req, res) => {
  res.json(req.user);
});

module.exports = router;