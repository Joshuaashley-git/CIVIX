const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.connected = false;
  }

  async initialize() {
    try {
      // Set up provider
      if (process.env.NODE_ENV === 'development') {
        // Local development
        this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      } else {
        // Production - use Sepolia testnet
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
      }

      // Set up signer
      if (process.env.PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      } else {
        // For local development, use the first hardhat account
        const accounts = await this.provider.listAccounts();
        if (accounts.length > 0) {
          this.signer = await this.provider.getSigner(0);
        } else {
          throw new Error('No accounts available');
        }
      }

      // Load contract ABI and address
      await this.loadContract();
      
      // Test connection
      await this.provider.getNetwork();
      this.connected = true;

      console.log('✅ Blockchain service connected');
      console.log('📍 Network:', await this.provider.getNetwork());
      console.log('💳 Signer address:', await this.signer.getAddress());
      console.log('📄 Contract address:', this.contractAddress);

    } catch (error) {
      console.error('❌ Blockchain service initialization failed:', error);
      throw error;
    }
  }

  async loadContract() {
    try {
      // Load contract ABI
      const artifactsPath = path.join(__dirname, '../../artifacts/contracts/CivixVoting.sol/CivixVoting.json');
      
      if (!fs.existsSync(artifactsPath)) {
        throw new Error('Contract artifacts not found. Please compile the contract first.');
      }

      const contractArtifacts = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
      
      // Load contract address from deployment file
      const deploymentPath = path.join(__dirname, '../../deployment.json');
      
      if (!fs.existsSync(deploymentPath)) {
        throw new Error('Contract not deployed. Please deploy the contract first.');
      }

      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      this.contractAddress = deployment.contractAddress;

      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        contractArtifacts.abi,
        this.signer
      );

    } catch (error) {
      console.error('❌ Failed to load contract:', error);
      throw error;
    }
  }

  isConnected() {
    return this.connected;
  }

  // Election functions
  async createElection(title, description, startTime, endTime) {
    try {
      const tx = await this.contract.createElection(title, description, startTime, endTime);
      const receipt = await tx.wait();
      
      // Get election ID from event
      const event = receipt.logs?.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'ElectionCreated';
        } catch {
          return false;
        }
      });
      let electionId;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        electionId = Number(parsed.args.electionId);
      }

      return {
        success: true,
        electionId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Create election failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addCandidate(electionId, name, description) {
    try {
      const tx = await this.contract.addCandidate(electionId, name, description);
      const receipt = await tx.wait();
      
      // Get candidate ID from event
      const event = receipt.logs?.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'CandidateAdded';
        } catch {
          return false;
        }
      });
      let candidateId;
      if (event) {
        const parsed = this.contract.interface.parseLog(event);
        candidateId = Number(parsed.args.candidateId);
      }

      return {
        success: true,
        candidateId,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('❌ Add candidate failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async castVote(electionId, candidateId, voterIdHash) {
    try {
      const tx = await this.contract.castVote(electionId, candidateId, voterIdHash);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('❌ Cast vote failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getElection(electionId) {
    try {
      const election = await this.contract.getElection(electionId);
      return {
        success: true,
        data: {
          id: Number(election.id),
          title: election.title,
          description: election.description,
          startTime: Number(election.startTime),
          endTime: Number(election.endTime),
          isActive: election.isActive,
          candidateCount: Number(election.candidateCount),
          totalVotes: Number(election.totalVotes)
        }
      };
    } catch (error) {
      console.error('❌ Get election failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getAllCandidates(electionId) {
    try {
      const candidates = await this.contract.getAllCandidates(electionId);
      
      const candidateList = [];
      for (let i = 0; i < candidates.ids.length; i++) {
        candidateList.push({
          id: Number(candidates.ids[i]),
          name: candidates.names[i],
          description: candidates.descriptions[i],
          voteCount: Number(candidates.voteCounts[i]),
          isActive: candidates.activeStatuses[i]
        });
      }

      return {
        success: true,
        data: candidateList
      };
    } catch (error) {
      console.error('❌ Get candidates failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getElectionResults(electionId) {
    try {
      const results = await this.contract.getElectionResults(electionId);
      
      const resultList = [];
      for (let i = 0; i < results.candidateIds.length; i++) {
        resultList.push({
          candidateId: Number(results.candidateIds[i]),
          candidateName: results.candidateNames[i],
          voteCount: Number(results.voteCounts[i])
        });
      }

      // Sort by vote count (descending)
      resultList.sort((a, b) => b.voteCount - a.voteCount);

      return {
        success: true,
        data: {
          results: resultList,
          totalVotes: Number(results.totalVotes)
        }
      };
    } catch (error) {
      console.error('❌ Get election results failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch on-chain vote history via VoteCasted events
  async getVoteHistory(electionId) {
    try {
      // Ensure contract is available
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      // Build filter for VoteCasted(electionId, anyCandidate, anyVoter)
      const filter = this.contract.filters.VoteCasted(
        electionId,
        null,
        null
      );

      const logs = await this.contract.queryFilter(filter, 0, 'latest');

      const history = logs.map((log) => {
        const parsed = this.contract.interface.parseLog(log);
        return {
          electionId: Number(parsed.args.electionId),
          candidateId: Number(parsed.args.candidateId),
          voter: parsed.args.voter,
          timestamp: new Date(Number(parsed.args.timestamp) * 1000).toISOString(),
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
        };
      });

      // Most recent first
      history.sort((a, b) => b.blockNumber - a.blockNumber);

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error('❌ Get vote history failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async hasVotedInElection(voterAddress, electionId) {
    try {
      const hasVoted = await this.contract.hasVotedInElection(voterAddress, electionId);
      return {
        success: true,
        hasVoted
      };
    } catch (error) {
      console.error('❌ Check vote status failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getElectionCount() {
    try {
      const count = await this.contract.electionCount();
      return {
        success: true,
        count: Number(count)
      };
    } catch (error) {
      console.error('❌ Get election count failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Admin functions
  async toggleElectionStatus(electionId) {
    try {
      const tx = await this.contract.toggleElectionStatus(electionId);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('❌ Toggle election status failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async pauseContract() {
    try {
      const tx = await this.contract.pause();
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('❌ Pause contract failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async unpauseContract() {
    try {
      const tx = await this.contract.unpause();
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error('❌ Unpause contract failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BlockchainService();