const axios = require('axios');

class AdminService {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    this.apiClient = axios.create({
      baseURL: `${this.backendUrl}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async isBackendConnected() {
    try {
      const response = await this.apiClient.get('/health');
      return {
        connected: response.data.blockchain?.connected || false,
        network: response.data.blockchain?.network || 'unknown',
        status: response.data.status || 'unknown'
      };
    } catch (error) {
      console.error('Backend connection check failed:', error.message);
      return {
        connected: false,
        network: 'unknown',
        status: 'error',
        error: error.message
      };
    }
  }

  async getDashboardData() {
    try {
      // Get health status
      const healthResponse = await this.apiClient.get('/health');
      const health = healthResponse.data;

      // Get elections data
      const electionsResponse = await this.apiClient.get('/elections');
      const elections = electionsResponse.data.data || [];

      // Calculate statistics
      let totalVotes = 0;
      let totalCandidates = 0;
      let activeElections = 0;

      for (const election of elections) {
        if (election.isActive) {
          activeElections++;
        }
        totalCandidates += election.candidateCount || 0;
        
        // Get vote count for each election
        try {
          const resultsResponse = await this.apiClient.get(`/elections/${election.id}/results`);
          totalVotes += resultsResponse.data.data?.totalVotes || 0;
        } catch (error) {
          console.error(`Failed to get results for election ${election.id}:`, error.message);
        }
      }

      return {
        totalElections: elections.length,
        activeElections,
        totalVotes,
        totalCandidates,
        blockchainConnected: health.blockchain?.connected || false,
        elections: elections.map(election => ({
          id: election.id,
          title: election.title,
          description: election.description,
          isActive: election.isActive,
          candidateCount: election.candidateCount || 0,
          startTime: election.startTime,
          endTime: election.endTime
        }))
      };
    } catch (error) {
      console.error('Failed to get dashboard data:', error.message);
      throw new Error('Failed to fetch dashboard data');
    }
  }

  async getAllElections() {
    try {
      const response = await this.apiClient.get('/elections');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get elections:', error.message);
      throw new Error('Failed to fetch elections');
    }
  }

  async getElection(electionId) {
    try {
      const response = await this.apiClient.get(`/elections/${electionId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get election ${electionId}:`, error.message);
      throw new Error(`Failed to fetch election ${electionId}`);
    }
  }

  async getElectionResults(electionId) {
    try {
      const response = await this.apiClient.get(`/elections/${electionId}/results`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get election results for ${electionId}:`, error.message);
      throw new Error(`Failed to fetch election results for ${electionId}`);
    }
  }

  async getCandidates(electionId) {
    try {
      const response = await this.apiClient.get(`/elections/${electionId}/candidates`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to get candidates for election ${electionId}:`, error.message);
      throw new Error(`Failed to fetch candidates for election ${electionId}`);
    }
  }

  async addCandidate(electionId, name, description) {
    try {
      const response = await this.apiClient.post(`/admin/elections/${electionId}/candidates`, {
        name,
        description
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to add candidate to election ${electionId}:`, error.message);
      throw new Error(`Failed to add candidate to election ${electionId}`);
    }
  }

  async createElection(title, description, durationHours) {
    try {
      const response = await this.apiClient.post('/admin/elections', {
        title,
        description,
        durationHours
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create election:', error.message);
      throw new Error('Failed to create election');
    }
  }

  async getAllVotes() {
    try {
      // Get all elections first
      const elections = await this.getAllElections();
      const allVotes = [];

      // Get votes for each election
      for (const election of elections) {
        try {
          const results = await this.getElectionResults(election.id);
          if (results && results.candidates) {
            results.candidates.forEach(candidate => {
              for (let i = 0; i < candidate.voteCount; i++) {
                allVotes.push({
                  electionId: election.id,
                  electionTitle: election.title,
                  candidateId: candidate.id,
                  candidateName: candidate.name,
                  timestamp: new Date().toISOString() // Note: Smart contract doesn't store individual vote timestamps
                });
              }
            });
          }
        } catch (error) {
          console.error(`Failed to get votes for election ${election.id}:`, error.message);
        }
      }

      return allVotes;
    } catch (error) {
      console.error('Failed to get all votes:', error.message);
      throw new Error('Failed to fetch votes');
    }
  }

  async getVoteStatistics() {
    try {
      const dashboardData = await this.getDashboardData();
      const votes = await this.getAllVotes();
      
      // Group votes by election and candidate
      const voteStats = {};
      
      votes.forEach(vote => {
        if (!voteStats[vote.electionId]) {
          voteStats[vote.electionId] = {
            electionTitle: vote.electionTitle,
            candidates: {}
          };
        }
        
        if (!voteStats[vote.electionId].candidates[vote.candidateId]) {
          voteStats[vote.electionId].candidates[vote.candidateId] = {
            name: vote.candidateName,
            count: 0
          };
        }
        
        voteStats[vote.electionId].candidates[vote.candidateId].count++;
      });

      return {
        totalVotes: dashboardData.totalVotes,
        totalElections: dashboardData.totalElections,
        activeElections: dashboardData.activeElections,
        blockchainConnected: dashboardData.blockchainConnected,
        voteBreakdown: voteStats
      };
    } catch (error) {
      console.error('Failed to get vote statistics:', error.message);
      throw new Error('Failed to fetch vote statistics');
    }
  }
}

module.exports = AdminService;

