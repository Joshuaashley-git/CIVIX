const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// Middleware for admin authentication (simple for demo)
const adminAuth = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization || authorization !== 'Bearer admin-token') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get dashboard overview
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const electionCountResult = await blockchainService.getElectionCount();
    
    if (!electionCountResult.success) {
      return res.status(500).json({ error: electionCountResult.error });
    }

    const electionCount = electionCountResult.count;
    const elections = [];
    let totalVotes = 0;

    // Get all elections data
    for (let i = 1; i <= electionCount; i++) {
      const electionResult = await blockchainService.getElection(i);
      if (electionResult.success) {
        elections.push(electionResult.data);
        totalVotes += electionResult.data.totalVotes;
      }
    }

    res.json({
      success: true,
      data: {
        totalElections: electionCount,
        totalVotes,
        elections: elections.map(election => ({
          id: election.id,
          title: election.title,
          isActive: election.isActive,
          totalVotes: election.totalVotes,
          candidateCount: election.candidateCount,
          startTime: new Date(election.startTime * 1000).toISOString(),
          endTime: new Date(election.endTime * 1000).toISOString(),
          status: election.isActive ? 
            (Date.now() < election.startTime * 1000 ? 'Upcoming' : 
             Date.now() > election.endTime * 1000 ? 'Ended' : 'Active') : 'Inactive'
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new election
router.post('/elections', adminAuth, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

    const result = await blockchainService.createElection(title, description, startTimestamp, endTimestamp);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: {
        electionId: result.electionId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      }
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add candidate to election
router.post('/elections/:electionId/candidates', adminAuth, async (req, res) => {
  try {
    const { electionId } = req.params;
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const result = await blockchainService.addCandidate(parseInt(electionId), name, description);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: {
        candidateId: result.candidateId,
        transactionHash: result.transactionHash
      }
    });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get election results
router.get('/elections/:electionId/results', adminAuth, async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const electionResult = await blockchainService.getElection(parseInt(electionId));
    const resultsResult = await blockchainService.getElectionResults(parseInt(electionId));

    if (!electionResult.success || !resultsResult.success) {
      return res.status(400).json({ 
        error: electionResult.error || resultsResult.error 
      });
    }

    res.json({
      success: true,
      data: {
        election: {
          ...electionResult.data,
          startTime: new Date(electionResult.data.startTime * 1000).toISOString(),
          endTime: new Date(electionResult.data.endTime * 1000).toISOString()
        },
        results: resultsResult.data.results.map((result, index) => ({
          ...result,
          percentage: resultsResult.data.totalVotes > 0 ? 
            ((result.voteCount / resultsResult.data.totalVotes) * 100).toFixed(2) : '0.00',
          position: index + 1
        })),
        totalVotes: resultsResult.data.totalVotes
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all election results for dashboard
router.get('/results', adminAuth, async (req, res) => {
  try {
    const electionCountResult = await blockchainService.getElectionCount();
    
    if (!electionCountResult.success) {
      return res.status(500).json({ error: electionCountResult.error });
    }

    const results = [];
    
    for (let i = 1; i <= electionCountResult.count; i++) {
      const electionResult = await blockchainService.getElection(i);
      const electionResultsResult = await blockchainService.getElectionResults(i);
      
      if (electionResult.success && electionResultsResult.success) {
        results.push({
          election: {
            ...electionResult.data,
            startTime: new Date(electionResult.data.startTime * 1000).toISOString(),
            endTime: new Date(electionResult.data.endTime * 1000).toISOString()
          },
          results: electionResultsResult.data.results,
          totalVotes: electionResultsResult.data.totalVotes
        });
      }
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle election status
router.patch('/elections/:electionId/toggle', adminAuth, async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const result = await blockchainService.toggleElectionStatus(parseInt(electionId));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: {
        transactionHash: result.transactionHash
      }
    });
  } catch (error) {
    console.error('Toggle election error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vote history for an election
router.get('/elections/:electionId/votes', adminAuth, async (req, res) => {
  try {
    const { electionId } = req.params;
    const result = await blockchainService.getVoteHistory(parseInt(electionId));
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Get vote history error:', error);
    res.status(500).json({ error: error.message });
  }
});

// "Remove" a candidate by disabling on-chain
router.delete('/elections/:electionId/candidates/:candidateId', adminAuth, async (req, res) => {
  try {
    const { electionId, candidateId } = req.params;
    const result = await blockchainService.setCandidateActive(parseInt(electionId), parseInt(candidateId), false);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true, data: { transactionHash: result.transactionHash, blockNumber: result.blockNumber, isActive: false } });
  } catch (error) {
    console.error('Disable candidate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get real-time vote counts for a specific election
router.get('/elections/:electionId/live-results', adminAuth, async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const candidatesResult = await blockchainService.getAllCandidates(parseInt(electionId));
    const electionResult = await blockchainService.getElection(parseInt(electionId));

    if (!candidatesResult.success || !electionResult.success) {
      return res.status(400).json({ 
        error: candidatesResult.error || electionResult.error 
      });
    }

    const totalVotes = electionResult.data.totalVotes;
    const candidates = candidatesResult.data.map(candidate => ({
      ...candidate,
      percentage: totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(2) : '0.00'
    }));

    // Sort by vote count
    candidates.sort((a, b) => b.voteCount - a.voteCount);

    res.json({
      success: true,
      data: {
        electionId: parseInt(electionId),
        totalVotes,
        candidates,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Live results error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
