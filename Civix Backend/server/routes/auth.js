const express = require('express');
const router = express.Router();

// Simple admin login for demo
router.post('/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple hardcoded admin credentials for demo
  if (email === 'admin@civix.com' && password === 'admin123') {
    res.json({
      success: true,
      token: 'admin-token',
      user: {
        email: 'admin@civix.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      error: 'Invalid credentials'
    });
  }
});

module.exports = router;