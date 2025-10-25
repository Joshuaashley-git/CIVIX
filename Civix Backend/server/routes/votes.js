const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const blockchainService = require('../services/blockchainService');

// Cast a vote
router.post('/', async (req, res) => {
  try {
    const { electionId, candidateId, voterIdHash } = req.body;

    if (!electionId || !candidateId || !voterIdHash) {
      return res.status(400).json({ error: 'Election ID, candidate ID, and voter ID hash are required' });
    }

    const result = await blockchainService.castVote(
      parseInt(electionId), 
      parseInt(candidateId), 
      voterIdHash
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      }
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cast a vote (alternative endpoint)
router.post('/cast', async (req, res) => {
  try {
    const { electionId, candidateId, voterIdHash } = req.body;

    if (!electionId || !candidateId || !voterIdHash) {
      return res.status(400).json({ error: 'Election ID, candidate ID, and voter ID hash are required' });
    }

    const result = await blockchainService.castVote(
      parseInt(electionId), 
      parseInt(candidateId), 
      voterIdHash
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber
      }
    });
  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if voter has voted in an election
router.get('/status/:electionId/:voterAddress', async (req, res) => {
  try {
    const { electionId, voterAddress } = req.params;
    
    const result = await blockchainService.hasVotedInElection(voterAddress, parseInt(electionId));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      hasVoted: result.hasVoted
    });
  } catch (error) {
    console.error('Check vote status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;