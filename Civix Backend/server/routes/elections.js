const express = require('express');
const router = express.Router();
const blockchainService = require('../services/blockchainService');

// Get all elections (public)
router.get('/', async (req, res) => {
  try {
    const electionCountResult = await blockchainService.getElectionCount();
    
    if (!electionCountResult.success) {
      return res.status(500).json({ error: electionCountResult.error });
    }

    const elections = [];
    
    for (let i = 1; i <= electionCountResult.count; i++) {
      const electionResult = await blockchainService.getElection(i);
      if (electionResult.success) {
        elections.push({
          ...electionResult.data,
          startTime: new Date(electionResult.data.startTime * 1000).toISOString(),
          endTime: new Date(electionResult.data.endTime * 1000).toISOString()
        });
      }
    }

    res.json({
      success: true,
      data: elections
    });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific election (public)
router.get('/:electionId', async (req, res) => {
  try {
    const { electionId } = req.params;
    const result = await blockchainService.getElection(parseInt(electionId));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: {
        ...result.data,
        startTime: new Date(result.data.startTime * 1000).toISOString(),
        endTime: new Date(result.data.endTime * 1000).toISOString()
      }
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get candidates for an election (public)
router.get('/:electionId/candidates', async (req, res) => {
  try {
    const { electionId } = req.params;
    const result = await blockchainService.getAllCandidates(parseInt(electionId));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get election results (public)
router.get('/:electionId/results', async (req, res) => {
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
        results: resultsResult.data.results,
        totalVotes: resultsResult.data.totalVotes
      }
    });
  } catch (error) {
    console.error('Get election results error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
