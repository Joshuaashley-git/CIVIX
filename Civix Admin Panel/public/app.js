// Global variables
let currentTab = 'dashboard';
let electionsData = [];
let votesData = [];
let candidatesData = [];

// API Base URL
const API_BASE_URL = '/api/admin';

// Utility functions
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('border-blue-500', 'text-blue-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    // Add active class to selected tab button
    const activeButton = document.getElementById(`tab-${tabName}`);
    activeButton.classList.remove('border-transparent', 'text-gray-500');
    activeButton.classList.add('border-blue-500', 'text-blue-600');
    
    currentTab = tabName;
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'elections':
            loadElectionsData();
            break;
        case 'votes':
            loadVotesData();
            break;
        case 'candidates':
            loadCandidatesData();
            break;
    }
}

// API functions
async function fetchData(url) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data.data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`Error: ${error.message}`, 'error');
        throw error;
    }
}

async function postData(url, data) {
    try {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'API request failed');
        }
        
        return result.data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(`Error: ${error.message}`, 'error');
        throw error;
    }
}

// Dashboard functions
async function loadDashboardData() {
    try {
        showLoading();
        const dashboardData = await fetchData('/dashboard');
        
        // Update stats
        document.getElementById('total-elections').textContent = dashboardData.totalElections;
        document.getElementById('active-elections').textContent = dashboardData.activeElections;
        document.getElementById('total-votes').textContent = dashboardData.totalVotes;
        document.getElementById('total-candidates').textContent = dashboardData.totalCandidates;
        
        // Update blockchain status
        updateBlockchainStatus(dashboardData.blockchainConnected);
        
        // Load elections list
        loadElectionsList(dashboardData.elections);
        
        // Load vote statistics
        await loadVoteStatistics();
        
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    } finally {
        hideLoading();
    }
}

function loadElectionsList(elections) {
    const container = document.getElementById('elections-list');
    
    if (elections.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No elections found</p>';
        return;
    }
    
    container.innerHTML = elections.map(election => `
        <div class="bg-white rounded-lg p-4 border border-gray-200">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold text-gray-900">${election.title}</h4>
                    <p class="text-sm text-gray-600 mt-1">${election.description}</p>
                    <div class="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                        <span><i class="fas fa-users mr-1"></i>${election.candidateCount} candidates</span>
                        <span class="px-2 py-1 rounded-full ${election.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${election.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                <button onclick="viewElectionDetails(${election.id})" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function loadVoteStatistics() {
    try {
        const voteStats = await fetchData('/votes');
        const container = document.getElementById('vote-stats');
        
        if (voteStats.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No votes recorded</p>';
            return;
        }
        
        // Group votes by election
        const electionVotes = {};
        voteStats.forEach(vote => {
            if (!electionVotes[vote.electionId]) {
                electionVotes[vote.electionId] = {
                    title: vote.electionTitle,
                    total: 0,
                    candidates: {}
                };
            }
            electionVotes[vote.electionId].total++;
            
            if (!electionVotes[vote.electionId].candidates[vote.candidateId]) {
                electionVotes[vote.electionId].candidates[vote.candidateId] = {
                    name: vote.candidateName,
                    count: 0
                };
            }
            electionVotes[vote.electionId].candidates[vote.candidateId].count++;
        });
        
        container.innerHTML = Object.values(electionVotes).map(election => `
            <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-semibold text-gray-900">${election.title}</h4>
                <p class="text-sm text-gray-600 mt-1">Total Votes: ${election.total}</p>
                <div class="mt-3 space-y-2">
                    ${Object.values(election.candidates).map(candidate => `
                        <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-700">${candidate.name}</span>
                            <span class="font-semibold text-blue-600">${candidate.count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load vote statistics:', error);
        document.getElementById('vote-stats').innerHTML = '<p class="text-red-500 text-center py-4">Failed to load vote statistics</p>';
    }
}

// Elections functions
async function loadElectionsData() {
    try {
        showLoading();
        electionsData = await fetchData('/elections');
        renderElectionsTable();
    } catch (error) {
        console.error('Failed to load elections data:', error);
    } finally {
        hideLoading();
    }
}

function renderElectionsTable() {
    const container = document.getElementById('elections-table');
    
    if (electionsData.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No elections found</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${electionsData.map(election => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">${election.title}</div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-900 max-w-xs truncate">${election.description}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                election.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }">
                                ${election.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${election.candidateCount || 0}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="viewElectionDetails(${election.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="viewElectionResults(${election.id})" class="text-green-600 hover:text-green-900">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Votes functions
async function loadVotesData() {
    try {
        showLoading();
        votesData = await fetchData('/votes');
        renderVotesTable();
    } catch (error) {
        console.error('Failed to load votes data:', error);
    } finally {
        hideLoading();
    }
}

function renderVotesTable() {
    const container = document.getElementById('votes-table');
    
    if (votesData.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No votes recorded</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Election</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${votesData.map(vote => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">${vote.electionTitle}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${vote.candidateName}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${new Date(vote.timestamp).toLocaleString()}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Candidates functions
async function loadCandidatesData() {
    try {
        showLoading();
        const elections = await fetchData('/elections');
        candidatesData = [];
        
        // Load candidates for each election
        for (const election of elections) {
            try {
                const candidates = await fetchData(`/elections/${election.id}/candidates`);
                candidates.forEach(candidate => {
                    candidatesData.push({
                        ...candidate,
                        electionTitle: election.title,
                        electionId: election.id
                    });
                });
            } catch (error) {
                console.error(`Failed to load candidates for election ${election.id}:`, error);
            }
        }
        
        renderCandidatesTable();
        populateElectionSelect();
    } catch (error) {
        console.error('Failed to load candidates data:', error);
    } finally {
        hideLoading();
    }
}

function renderCandidatesTable() {
    const container = document.getElementById('candidates-table');
    
    if (candidatesData.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No candidates found</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Election</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votes</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${candidatesData.map(candidate => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">${candidate.name}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${candidate.electionTitle}</div>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm text-gray-900 max-w-xs truncate">${candidate.description}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${candidate.voteCount || 0}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Modal functions
function showCreateElectionModal() {
    document.getElementById('create-election-modal').classList.remove('hidden');
}

function hideCreateElectionModal() {
    document.getElementById('create-election-modal').classList.add('hidden');
    document.getElementById('create-election-form').reset();
}

function showAddCandidateModal() {
    document.getElementById('add-candidate-modal').classList.remove('hidden');
}

function hideAddCandidateModal() {
    document.getElementById('add-candidate-modal').classList.add('hidden');
    document.getElementById('add-candidate-form').reset();
}

async function populateElectionSelect() {
    const select = document.getElementById('candidate-election');
    select.innerHTML = '<option value="">Select an election</option>';
    
    electionsData.forEach(election => {
        const option = document.createElement('option');
        option.value = election.id;
        option.textContent = election.title;
        select.appendChild(option);
    });
}

// Form handlers
document.getElementById('create-election-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('election-title').value;
    const description = document.getElementById('election-description').value;
    const durationHours = parseInt(document.getElementById('election-duration').value);
    
    try {
        showLoading();
        await postData('/elections', { title, description, durationHours });
        showNotification('Election created successfully!', 'success');
        hideCreateElectionModal();
        loadElectionsData();
        loadDashboardData();
    } catch (error) {
        console.error('Failed to create election:', error);
    } finally {
        hideLoading();
    }
});

document.getElementById('add-candidate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const electionId = parseInt(document.getElementById('candidate-election').value);
    const name = document.getElementById('candidate-name').value;
    const description = document.getElementById('candidate-description').value;
    
    try {
        showLoading();
        await postData(`/elections/${electionId}/candidates`, { name, description });
        showNotification('Candidate added successfully!', 'success');
        hideAddCandidateModal();
        loadCandidatesData();
        loadDashboardData();
    } catch (error) {
        console.error('Failed to add candidate:', error);
    } finally {
        hideLoading();
    }
});

// Utility functions
function updateBlockchainStatus(backendStatus) {
    const indicator = document.getElementById('status-indicator');
    const text = document.getElementById('status-text');
    
    // Handle both boolean and object formats
    const connected = typeof backendStatus === 'boolean' ? backendStatus : backendStatus?.connected;
    
    if (connected) {
        indicator.className = 'w-3 h-3 rounded-full mr-2 status-connected';
        text.textContent = 'Connected';
    } else {
        indicator.className = 'w-3 h-3 rounded-full mr-2 status-disconnected pulse-animation';
        text.textContent = 'Disconnected';
    }
}

function refreshData() {
    switch(currentTab) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'elections':
            loadElectionsData();
            break;
        case 'votes':
            loadVotesData();
            break;
        case 'candidates':
            loadCandidatesData();
            break;
    }
}

function refreshVotes() {
    loadVotesData();
}

function viewElectionDetails(electionId) {
    showNotification(`Viewing election ${electionId} details`, 'info');
    // TODO: Implement election details view
}

function viewElectionResults(electionId) {
    showNotification(`Viewing election ${electionId} results`, 'info');
    // TODO: Implement election results view
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadDashboardData();
    
    // Set up periodic refresh for blockchain status
    setInterval(async () => {
        try {
            const health = await fetchData('/health');
            updateBlockchainStatus(health.backend);
        } catch (error) {
            updateBlockchainStatus({ connected: false });
        }
    }, 30000); // Check every 30 seconds
});

