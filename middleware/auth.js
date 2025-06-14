const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Check for token presence with optional chaining
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    // Verify token and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID only
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired' });
    }

    // Attach both user and token to request
    req.token = token;
    req.user = user;
    next();

  } catch (err) {
    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    // Default error response
    res.status(401).json({ 
      error: 'Please authenticate',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = auth;