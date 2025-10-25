const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const electionRoutes = require('./routes/elections');
const voteRoutes = require('./routes/votes');
const adminRoutes = require('./routes/admin');

// Import blockchain service
const blockchainService = require('./services/blockchainService');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', // React frontend
    'http://localhost:5173', // Vite frontend
    'http://localhost:8080', // Vite frontend (alternative port)
    'http://localhost:3001'  // Admin panel
  ],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Civix Backend API is running',
    timestamp: new Date().toISOString(),
    blockchain: {
      connected: blockchainService.isConnected(),
      network: process.env.NODE_ENV === 'development' ? 'localhost' : 'sepolia'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

// Initialize blockchain service and start server
async function startServer() {
  try {
    // Initialize blockchain connection
    await blockchainService.initialize();
    console.log('✅ Blockchain service initialized');
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Civix Backend API running on port ${PORT}`);
      console.log(`📊 Admin Panel: http://localhost:3001`);
      console.log(`🌐 Frontend: http://localhost:3000`);
      console.log(`📡 Blockchain Network: ${process.env.NODE_ENV === 'development' ? 'Localhost' : 'Sepolia'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔄 Gracefully shutting down...');
  process.exit(0);
});

startServer();