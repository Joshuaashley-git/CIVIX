import { api } from './api';

// Types for API responses
export interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: number;
  isActive: boolean;
}

export interface Election {
  id: number;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  candidateCount: number;
  totalVotes: number;
}

export interface VoteResponse {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
}

export interface ElectionResults {
  results: Array<{
    candidateId: number;
    candidateName: string;
    voteCount: number;
  }>;
  totalVotes: number;
}

// Raw response from the cast vote API endpoint
interface CastVoteApiResponse {
  success: boolean;
  data?: { transactionHash: string; blockNumber: number };
  error?: string;
  message?: string;
}

// Election API functions
export const electionApi = {
  // Get all elections
  async getElections(): Promise<Election[]> {
    try {
      const response = await api.get<{ success: boolean; data: any[] }>(
        '/elections'
      );
      const items = response.data || [];
      const normalized: Election[] = items.map((e: any) => ({
        ...e,
        startTime: typeof e.startTime === 'string' ? Math.floor(new Date(e.startTime).getTime() / 1000) : e.startTime,
        endTime: typeof e.endTime === 'string' ? Math.floor(new Date(e.endTime).getTime() / 1000) : e.endTime,
      }));
      return normalized;
    } catch (error) {
      console.error('Failed to fetch elections:', error);
      throw error;
    }
  },

  // Get a specific election
  async getElection(electionId: number): Promise<Election> {
    try {
      const response = await api.get<{ success: boolean; data: any }>(
        `/elections/${electionId}`
      );
      if (!response.success) {
        throw new Error('Failed to fetch election');
      }
      const e = response.data;
      const normalized: Election = {
        ...e,
        startTime: typeof e.startTime === 'string' ? Math.floor(new Date(e.startTime).getTime() / 1000) : e.startTime,
        endTime: typeof e.endTime === 'string' ? Math.floor(new Date(e.endTime).getTime() / 1000) : e.endTime,
      };
      return normalized;
    } catch (error) {
      console.error('Failed to fetch election:', error);
      throw error;
    }
  },

  // Get candidates for an election
  async getCandidates(electionId: number): Promise<Candidate[]> {
    try {
      const response = await api.get<{ success: boolean; data: Candidate[] }>(
        `/elections/${electionId}/candidates`
      );
      if (!response.success) {
        throw new Error('Failed to fetch candidates');
      }
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch candidates:', error);
      throw error;
    }
  },

  // Cast a vote
  async castVote(
    electionId: number,
    candidateId: number,
    voterIdHash: string
  ): Promise<VoteResponse> {
    try {
      const payload = { electionId, candidateId, voterIdHash };
      const response = await api.post<CastVoteApiResponse>(
        '/votes',
        payload
      );
      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Failed to cast vote',
        };
      }
      return {
        success: true,
        transactionHash: response.data?.transactionHash,
        blockNumber: response.data?.blockNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to cast vote',
      };
    }
  },

  // Check if user has voted
  async hasVoted(voterAddress: string, electionId: number): Promise<boolean> {
    try {
      const response = await api.get<{
        success: boolean;
        hasVoted: boolean;
      }>(`/votes/status/${electionId}/${voterAddress}`);
      return response.hasVoted || false;
    } catch (error) {
      console.error('Failed to check vote status:', error);
      return false;
    }
  },

  // Get election results (public endpoint)
  async getResults(electionId: number): Promise<ElectionResults> {
    try {
      const response = await api.get<{
        success: boolean;
        data: ElectionResults;
      }>(`/elections/${electionId}/results`);
      if (!response.success) {
        throw new Error('Failed to fetch results');
      }
      return response.data;
    } catch (error) {
      console.error('Failed to fetch results:', error);
      throw error;
    }
  },

  // Get the current active election
  async getCurrentElection(): Promise<{
    election: Election;
    candidates: Candidate[];
  } | null> {
    try {
      const elections = await this.getElections();
      if (!elections || elections.length === 0) {
        return null;
      }
      const active = elections.filter((e) => isElectionActive(e));
      const current = active.length > 0 ? active[0] : elections[0];
      const candidates = await this.getCandidates(current.id);
      return { election: current, candidates };
    } catch (error) {
      throw error;
    }
  },
};

// Utility functions
export const formatElectionTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

export const isElectionActive = (election: Election): boolean => {
  const now = Math.floor(Date.now() / 1000);
  return election.isActive && now >= election.startTime && now <= election.endTime;
};

export const generateVoterIdHash = (voterId: string): string => {
  // Simple hash function for demo - in production, use proper cryptographic hashing
  let hash = 0;
  for (let i = 0; i < voterId.length; i++) {
    const char = voterId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};
