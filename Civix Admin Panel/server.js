const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import admin services
const AdminService = require('./src/services/AdminService');

// Initialize admin service
const adminService = new AdminService();

// Admin API Routes
app.get('/api/admin/health', async (req, res) => {
  const backendStatus = await adminService.isBackendConnected();
  res.json({
    success: true,
    data: {
      status: 'OK',
      message: 'Civix Admin Panel API is running',
      timestamp: new Date().toISOString(),
      backend: backendStatus
    }
  });
});

// Dashboard data
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const dashboardData = await adminService.getDashboardData();
    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle election active status (proxies to backend admin)
app.patch('/api/admin/elections/:id/toggle', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const result = await adminService.toggleElectionStatus(electionId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Toggle election error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update candidate (UI-level override only)
app.patch('/api/admin/elections/:id/candidates/:candidateId', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const candidateId = parseInt(req.params.candidateId);
    const { name, description } = req.body || {};
    if (!name && !description) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    const result = await adminService.updateCandidateUi(electionId, candidateId, { name, description });
    // Broadcast update
    broadcastCandidateUpdate({ type: 'update', electionId, candidateId, name, description });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update candidate (UI) error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove candidate (UI-level soft delete only)
app.delete('/api/admin/elections/:id/candidates/:candidateId', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const candidateId = parseInt(req.params.candidateId);
    const result = await adminService.removeCandidateUi(electionId, candidateId);
    // Broadcast removal
    broadcastCandidateUpdate({ type: 'remove', electionId, candidateId });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Remove candidate (UI) error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all elections
app.get('/api/admin/elections', async (req, res) => {
  try {
    const elections = await adminService.getAllElections();
    res.json({
      success: true,
      data: elections
    });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get election details
app.get('/api/admin/elections/:id', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const election = await adminService.getElection(electionId);
    res.json({
      success: true,
      data: election
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get election results
app.get('/api/admin/elections/:id/results', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const results = await adminService.getElectionResults(electionId);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get election results error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get candidates for an election
app.get('/api/admin/elections/:id/candidates', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const candidates = await adminService.getCandidates(electionId);
    res.json({
      success: true,
      data: candidates
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add candidate to election
app.post('/api/admin/elections/:id/candidates', async (req, res) => {
  try {
    const electionId = parseInt(req.params.id);
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }

    const result = await adminService.addCandidate(electionId, name, description);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new election
app.post('/api/admin/elections', async (req, res) => {
  try {
    const { title, description, durationHours = 24 } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Title and description are required'
      });
    }

    const result = await adminService.createElection(title, description, durationHours);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all votes
app.get('/api/admin/votes', async (req, res) => {
  try {
    const votes = await adminService.getAllVotes();
    res.json({
      success: true,
      data: votes
    });
  } catch (error) {
    console.error('Get votes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Realtime voting via Server-Sent Events (SSE)
const sseClients = new Set();
// Realtime candidate updates via SSE
const sseCandidateClients = new Set();

function broadcastVote(vote) {
  const data = `data: ${JSON.stringify(vote)}\n\n`;
  for (const client of sseClients) {
    client.write(data);
  }
}

function broadcastCandidateUpdate(update) {
  const data = `data: ${JSON.stringify(update)}\n\n`;
  for (const client of sseCandidateClients) {
    client.write(data);
  }
}

app.get('/api/admin/vote-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Initial connection confirmation
  res.write(': connected\n\n');

  // Add client
  sseClients.add(res);

  // Remove on close
  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Candidate updates SSE stream
app.get('/api/admin/candidate-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Initial connection confirmation
  res.write(': connected\n\n');

  // Add client
  sseCandidateClients.add(res);

  // Remove on close
  req.on('close', () => {
    sseCandidateClients.delete(res);
  });
});

// Endpoint to receive vote notifications (from frontend) and broadcast
app.post('/api/admin/notify-vote', async (req, res) => {
  try {
    const { electionId, electionTitle, candidateId, candidateName, timestamp, transactionHash, blockNumber, isHighlighted } = req.body || {};
    if (!electionId || !candidateId) {
      return res.status(400).json({ success: false, error: 'electionId and candidateId are required' });
    }

    const vote = {
      electionId,
      electionTitle: electionTitle || 'Mock Election 2023',
      candidateId,
      candidateName: candidateName || 'Unknown Candidate',
      timestamp: timestamp || new Date().toISOString(),
      transactionHash: transactionHash || null,
      blockNumber: typeof blockNumber === 'number' ? blockNumber : null,
      isHighlighted: Boolean(isHighlighted)
    };

    if (adminService.addMockVote) {
      await adminService.addMockVote(vote);
    }

    broadcastVote(vote);

    res.json({ success: true, data: vote });
  } catch (error) {
    console.error('Notify vote error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the admin panel
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files for any other route
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Civix Admin Panel running on port ${PORT}`);
  console.log(`📊 Admin Panel: http://localhost:${PORT}`);
  console.log(`🌐 Backend API: http://localhost:5001`);
  console.log(`🗳️  Frontend: http://localhost:8080`);
});

module.exports = app;
