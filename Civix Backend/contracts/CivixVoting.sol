// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CivixVoting
 * @dev A secure blockchain-based voting contract for Civix platform
 */
contract CivixVoting is Ownable, ReentrancyGuard, Pausable {
    
    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
        bool isActive;
    }
    
    struct Election {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(uint256 => Candidate) candidates;
        uint256 candidateCount;
        uint256 totalVotes;
    }
    
    struct Voter {
        bool hasVoted;
        uint256 votedElectionId;
        uint256 votedCandidateId;
        uint256 timestamp;
    }
    
    // State variables
    mapping(uint256 => Election) public elections;
    mapping(address => mapping(uint256 => Voter)) public voters; // voter address => election id => voter info
    mapping(string => bool) public usedVoterIds; // To prevent duplicate voting with same ID
    
    uint256 public electionCount;
    
    // Events
    event ElectionCreated(uint256 indexed electionId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name);
    event VoteCasted(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter, uint256 timestamp);
    event ElectionStatusChanged(uint256 indexed electionId, bool isActive);
    
    // Modifiers
    modifier electionExists(uint256 _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election does not exist");
        _;
    }
    
    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp >= elections[_electionId].startTime, "Election has not started");
        require(block.timestamp <= elections[_electionId].endTime, "Election has ended");
        _;
    }
    
    modifier candidateExists(uint256 _electionId, uint256 _candidateId) {
        require(_candidateId > 0 && _candidateId <= elections[_electionId].candidateCount, "Candidate does not exist");
        require(elections[_electionId].candidates[_candidateId].isActive, "Candidate is not active");
        _;
    }
    
    modifier hasNotVoted(uint256 _electionId) {
        require(!voters[msg.sender][_electionId].hasVoted, "You have already voted in this election");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Create a new election
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyOwner returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_endTime > _startTime, "End time must be after start time");
        require(_startTime > block.timestamp, "Start time must be in the future");
        
        electionCount++;
        
        Election storage newElection = elections[electionCount];
        newElection.id = electionCount;
        newElection.title = _title;
        newElection.description = _description;
        newElection.startTime = _startTime;
        newElection.endTime = _endTime;
        newElection.isActive = true;
        newElection.candidateCount = 0;
        newElection.totalVotes = 0;
        
        emit ElectionCreated(electionCount, _title, _startTime, _endTime);
        
        return electionCount;
    }
    
    /**
     * @dev Add a candidate to an election
     */
    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _description
    ) external onlyOwner electionExists(_electionId) returns (uint256) {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(block.timestamp < elections[_electionId].startTime, "Cannot add candidates after election starts");
        
        Election storage election = elections[_electionId];
        election.candidateCount++;
        
        Candidate storage newCandidate = election.candidates[election.candidateCount];
        newCandidate.id = election.candidateCount;
        newCandidate.name = _name;
        newCandidate.description = _description;
        newCandidate.voteCount = 0;
        newCandidate.isActive = true;
        
        emit CandidateAdded(_electionId, election.candidateCount, _name);
        
        return election.candidateCount;
    }
    
    /**
     * @dev Cast a vote for a candidate
     */
    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        string memory _voterIdHash
    ) external 
        nonReentrant 
        whenNotPaused 
        electionExists(_electionId) 
        electionActive(_electionId) 
        candidateExists(_electionId, _candidateId) 
        hasNotVoted(_electionId) 
    {
        require(!usedVoterIds[_voterIdHash], "This voter ID has already been used");
        
        // Mark voter ID as used
        usedVoterIds[_voterIdHash] = true;
        
        // Record the vote
        voters[msg.sender][_electionId] = Voter({
            hasVoted: true,
            votedElectionId: _electionId,
            votedCandidateId: _candidateId,
            timestamp: block.timestamp
        });
        
        // Increment candidate vote count
        elections[_electionId].candidates[_candidateId].voteCount++;
        elections[_electionId].totalVotes++;
        
        emit VoteCasted(_electionId, _candidateId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get election details
     */
    function getElection(uint256 _electionId) external view electionExists(_electionId) returns (
        uint256 id,
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        uint256 candidateCount,
        uint256 totalVotes
    ) {
        Election storage election = elections[_electionId];
        return (
            election.id,
            election.title,
            election.description,
            election.startTime,
            election.endTime,
            election.isActive,
            election.candidateCount,
            election.totalVotes
        );
    }
    
    /**
     * @dev Get candidate details
     */
    function getCandidate(uint256 _electionId, uint256 _candidateId) external view 
        electionExists(_electionId) 
        candidateExists(_electionId, _candidateId) 
        returns (
            uint256 id,
            string memory name,
            string memory description,
            uint256 voteCount,
            bool isActive
        ) {
        Candidate storage candidate = elections[_electionId].candidates[_candidateId];
        return (
            candidate.id,
            candidate.name,
            candidate.description,
            candidate.voteCount,
            candidate.isActive
        );
    }
    
    /**
     * @dev Get all candidates for an election
     */
    function getAllCandidates(uint256 _electionId) external view electionExists(_electionId) returns (
        uint256[] memory ids,
        string[] memory names,
        string[] memory descriptions,
        uint256[] memory voteCounts,
        bool[] memory activeStatuses
    ) {
        Election storage election = elections[_electionId];
        uint256 count = election.candidateCount;
        
        ids = new uint256[](count);
        names = new string[](count);
        descriptions = new string[](count);
        voteCounts = new uint256[](count);
        activeStatuses = new bool[](count);
        
        for (uint256 i = 1; i <= count; i++) {
            Candidate storage candidate = election.candidates[i];
            ids[i-1] = candidate.id;
            names[i-1] = candidate.name;
            descriptions[i-1] = candidate.description;
            voteCounts[i-1] = candidate.voteCount;
            activeStatuses[i-1] = candidate.isActive;
        }
        
        return (ids, names, descriptions, voteCounts, activeStatuses);
    }
    
    /**
     * @dev Get election results
     */
    function getElectionResults(uint256 _electionId) external view electionExists(_electionId) returns (
        uint256[] memory candidateIds,
        string[] memory candidateNames,
        uint256[] memory voteCounts,
        uint256 totalVotes
    ) {
        Election storage election = elections[_electionId];
        uint256 count = election.candidateCount;
        
        candidateIds = new uint256[](count);
        candidateNames = new string[](count);
        voteCounts = new uint256[](count);
        
        for (uint256 i = 1; i <= count; i++) {
            Candidate storage candidate = election.candidates[i];
            candidateIds[i-1] = candidate.id;
            candidateNames[i-1] = candidate.name;
            voteCounts[i-1] = candidate.voteCount;
        }
        
        return (candidateIds, candidateNames, voteCounts, election.totalVotes);
    }
    
    /**
     * @dev Check if voter has voted in an election
     */
    function hasVotedInElection(address _voter, uint256 _electionId) external view returns (bool) {
        return voters[_voter][_electionId].hasVoted;
    }
    
    /**
     * @dev Toggle election active status (only owner)
     */
    function toggleElectionStatus(uint256 _electionId) external onlyOwner electionExists(_electionId) {
        elections[_electionId].isActive = !elections[_electionId].isActive;
        emit ElectionStatusChanged(_electionId, elections[_electionId].isActive);
    }
    
    /**
     * @dev Emergency pause/unpause (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}