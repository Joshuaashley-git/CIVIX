const axios = require('axios');
const store = require('../store');

class AdminService {
  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    this.adminToken = process.env.ADMIN_TOKEN || 'admin-token';
    this.apiClient = axios.create({
      baseURL: `${this.backendUrl}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.adminToken}`
      }
    });

    // In-memory mock data store for realtime admin updates
    this.mockElections = [
      {
        id: 1,
        title: "Mock Election 2023",
        description: "This is a mock election for testing purposes",
        isActive: true,
        candidateCount: 3,
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
      }
    ];

    this.mockCandidates = {
      1: [
        { id: 1, name: "Alice Johnson", description: "Experienced leader" },
        { id: 2, name: "Bob Smith", description: "Community advocate" },
        { id: 3, name: "Carol Williams", description: "Innovator and strategist" }
      ]
    };

    this.mockVotes = [
      {
        electionId: 1,
        electionTitle: "Mock Election 2023",
        candidateId: 1,
        candidateName: "Alice Johnson",
        timestamp: new Date().toISOString(),
        transactionHash: "0x" + Math.random().toString(16).substring(2, 42)
      },
      {
        electionId: 1,
        electionTitle: "Mock Election 2023",
        candidateId: 2,
        candidateName: "Bob Smith",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        transactionHash: "0x" + Math.random().toString(16).substring(2, 42)
      },
      {
        electionId: 1,
        electionTitle: "Mock Election 2023",
        candidateId: 3,
        candidateName: "Carol Williams",
        timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        transactionHash: "0x" + Math.random().toString(16).substring(2, 42)
      }
    ];

    this.removedCandidates = {};
    this.candidateOverrides = {};
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
      const response = await this.apiClient.get('/admin/dashboard');
      const data = response.data?.data;
      if (!data) throw new Error('Invalid dashboard response');

      const activeElections = (data.elections || []).filter((e) => e.status === 'Active').length;
      const totalCandidates = (data.elections || []).reduce((sum, e) => sum + (e.candidateCount || 0), 0);

      return {
        totalElections: data.totalElections || 0,
        activeElections,
        totalVotes: data.totalVotes || 0,
        totalCandidates,
        blockchainConnected: true,
        elections: data.elections || []
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
      let list = response.data.data || [];

      // Apply persistent removals from JSON store
      const removedIds = new Set(store.getRemovedCandidates(electionId).map(Number));
      if (removedIds.size) {
        list = list.filter((c) => !removedIds.has(Number(c.id)));
      }

      // Apply persistent overrides from JSON store
      const overridesMap = store.getCandidateOverrides(electionId);
      list = list.map((c) => {
        const ov = overridesMap[String(c.id)] || {};
        return {
          ...c,
          name: ov.name ?? c.name,
          description: ov.description ?? c.description,
        };
      });

      return list;
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
      const now = Date.now();
      const startTime = new Date(now + 60 * 1000).toISOString(); // start in 60s to satisfy contract requirement
      const endTime = new Date(now + (durationHours || 24) * 60 * 60 * 1000).toISOString();

      const response = await this.apiClient.post('/admin/elections', {
        title,
        description,
        startTime,
        endTime
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to create election:', error.message);
      throw new Error('Failed to create election');
    }
  }

  async toggleElectionStatus(electionId) {
    try {
      const response = await this.apiClient.patch(`/admin/elections/${electionId}/toggle`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to toggle election ${electionId} status`);
    }
  }

  async removeCandidateUi(electionId, candidateId) {
    store.addRemovedCandidate(electionId, candidateId);
    return { success: true };
  }

  async updateCandidateUi(electionId, candidateId, payload) {
    store.setCandidateOverride(electionId, candidateId, payload);
    return { success: true };
  }

  async getAllVotes() {
    try {
      // Return in-memory mock votes to support realtime updates
      return this.mockVotes;
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
  addMockVote(vote) {
    const election = this.mockElections.find(e => e.id === vote.electionId) || this.mockElections[0];
    const candidates = this.mockCandidates[election.id] || [];
    const candidate = candidates.find(c => c.id === vote.candidateId);

    const normalized = {
      electionId: election.id,
      electionTitle: vote.electionTitle || election.title,
      candidateId: vote.candidateId,
      candidateName: vote.candidateName || candidate?.name || 'Unknown Candidate',
      timestamp: vote.timestamp || new Date().toISOString(),
      transactionHash: vote.transactionHash || ("0x" + Math.random().toString(16).substring(2, 42)),
      blockNumber: typeof vote.blockNumber === 'number' ? vote.blockNumber : null,
      isHighlighted: Boolean(vote.isHighlighted)
    };

    this.mockVotes.push(normalized);
    return normalized;
  }

}

module.exports = AdminService;

