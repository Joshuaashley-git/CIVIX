// Global variables
let currentTab = 'dashboard';
let electionsData = [];
let votesData = [];
let candidatesData = [];
let editContext = { electionId: null, candidateId: null };

// API Base URL
const API_BASE_URL = '/api/admin';

// Utility functions
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

// Edit Candidate Modal logic
function showEditCandidateModal() {
    document.getElementById('edit-candidate-modal').classList.remove('hidden');
}

function hideEditCandidateModal() {
    document.getElementById('edit-candidate-modal').classList.add('hidden');
    document.getElementById('edit-candidate-form').reset();
    editContext = { electionId: null, candidateId: null };
}

function openEditCandidate(electionId, candidateId) {
    const candidate = candidatesData.find(c => c.electionId === electionId && c.id === candidateId);
    if (!candidate) {
        showNotification('Candidate not found', 'error');
        return;
    }
    editContext = { electionId, candidateId };
    document.getElementById('edit-candidate-name').value = candidate.name || '';
    document.getElementById('edit-candidate-description').value = candidate.description || '';
    showEditCandidateModal();
}

var __editForm = document.getElementById('edit-candidate-form');
if (__editForm) {
    __editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const name = (document.getElementById('edit-candidate-name').value || '').trim();
            const description = (document.getElementById('edit-candidate-description').value || '').trim();
            if (!editContext.electionId || !editContext.candidateId) throw new Error('Missing edit context');
            showLoading();
            const res = await fetch(`${API_BASE_URL}/elections/${editContext.electionId}/candidates/${editContext.candidateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to update candidate');
            showNotification('Candidate updated', 'success');
            hideEditCandidateModal();
            await loadCandidatesData();
            await loadDashboardData();
        } catch (err) {
            showNotification('Update failed: ' + (err && err.message ? err.message : String(err)), 'error');
        } finally {
            hideLoading();
        }
    });
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
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <button onclick="viewElectionDetails(${election.id})" class="text-blue-600 hover:text-blue-900">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="viewElectionResults(${election.id})" class="text-green-600 hover:text-green-900">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button onclick="toggleElectionStatus(${election.id})" class="text-yellow-600 hover:text-yellow-800">
                                <i class="fas fa-toggle-on"></i>
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${votesData.map(vote => `
                    <tr ${vote.isHighlighted ? 'class="bg-green-50"' : ''}>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm font-medium text-gray-900">${vote.electionTitle}</div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900">${vote.candidateName}</div>
                            ${vote.isHighlighted ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">Your Vote</span>' : ''}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${new Date(vote.timestamp).toLocaleString()}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${vote.transactionHash ? `<span class="font-mono text-xs">${vote.transactionHash.substring(0, 10)}...</span>` : 'N/A'}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${(vote.blockNumber !== null && vote.blockNumber !== undefined) ? vote.blockNumber : '—'}
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                            <button type="button" class="text-blue-600 hover:text-blue-900 edit-candidate-btn" data-election-id="${candidate.electionId}" data-candidate-id="${candidate.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="text-red-600 hover:text-red-900 remove-candidate-btn" data-election-id="${candidate.electionId}" data-candidate-id="${candidate.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Admin actions
async function toggleElectionStatus(electionId) {
    try {
        showLoading();
        const res = await fetch(`${API_BASE_URL}/elections/${electionId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to toggle');
        showNotification('Election status toggled', 'success');
        await loadElectionsData();
        await loadDashboardData();
    } catch (err) {
        showNotification(`Toggle failed: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function editCandidate(electionId, candidateId, currentName, currentDescription) {
    try {
        const name = prompt('Edit candidate name:', currentName);
        if (name === null) return;
        const description = prompt('Edit candidate description:', currentDescription || '');
        if (description === null) return;
        showLoading();
        const res = await fetch(`${API_BASE_URL}/elections/${electionId}/candidates/${candidateId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update candidate');
        showNotification('Candidate updated', 'success');
        await loadCandidatesData();
        await loadDashboardData();
    } catch (err) {
        showNotification(`Update failed: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
}

async function removeCandidate(electionId, candidateId) {
    try {
        if (!confirm('Remove this candidate from the Admin Panel view? This does not change the blockchain.')) return;
        showLoading();
        const res = await fetch(`${API_BASE_URL}/elections/${electionId}/candidates/${candidateId}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to remove candidate');
        showNotification('Candidate removed (UI only)', 'success');
        await loadCandidatesData();
        await loadDashboardData();
    } catch (err) {
        showNotification(`Remove failed: ${err.message}`, 'error');
    } finally {
        hideLoading();
    }
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

    // Start realtime vote stream
    initVoteStream();
    
    // Set up periodic refresh for blockchain status
    setInterval(async () => {
        try {
            const health = await fetchData('/health');
            updateBlockchainStatus(health.backend);
        } catch (error) {
            updateBlockchainStatus({ connected: false });
        }
    }, 30000); // Check every 30 seconds

    // Ensure tab navigation works even if inline onclick is blocked by CSP
    const tabs = ['dashboard', 'elections', 'votes', 'candidates'];
    tabs.forEach((name) => {
        const btn = document.getElementById(`tab-${name}`);
        if (btn) {
            btn.addEventListener('click', () => showTab(name));
        }
    });

    // Event delegation for dynamically rendered candidate actions
    const candidatesTableContainer = document.getElementById('candidates-table');
    if (candidatesTableContainer) {
        candidatesTableContainer.addEventListener('click', (ev) => {
            const target = ev.target;
            if (!target) return;
            let btn = target;
            // climb up if icon was clicked
            if (btn.tagName && btn.tagName.toLowerCase() !== 'button') {
                if (btn.closest) { btn = btn.closest('button'); }
            }
            if (!btn || !btn.classList) return;
            if (btn.classList.contains('edit-candidate-btn')) {
                const eid = parseInt(btn.getAttribute('data-election-id'));
                const cid = parseInt(btn.getAttribute('data-candidate-id'));
                if (!isNaN(eid) && !isNaN(cid)) {
                    openEditCandidate(eid, cid);
                }
            } else if (btn.classList.contains('remove-candidate-btn')) {
                const eid = parseInt(btn.getAttribute('data-election-id'));
                const cid = parseInt(btn.getAttribute('data-candidate-id'));
                if (!isNaN(eid) && !isNaN(cid)) {
                    removeCandidate(eid, cid);
                }
            }
        });
    }
});

// Realtime updates via Server-Sent Events (SSE)
function initVoteStream() {
    try {
        const eventSource = new EventSource('/api/admin/vote-stream');

        eventSource.onmessage = (event) => {
            // Heartbeat or comments are ignored
            if (!event.data || event.data === ': connected') return;
            try {
                const vote = JSON.parse(event.data);
                // Update local votes cache
                votesData.unshift(vote);
                // Re-render votes table
                renderVotesTable();
                // Optionally refresh dashboard stats
                loadDashboardData();
                // Show toast
                showNotification(`New vote for ${vote.candidateName}${vote.transactionHash ? ` (tx ${vote.transactionHash.substring(0,10)}...)` : ''}`, 'success');
            } catch (e) {
                console.error('Failed to parse SSE vote event', e);
            }
        };

        eventSource.onerror = () => {
            console.warn('SSE connection error. Reconnecting in 5s...');
            eventSource.close();
            setTimeout(initVoteStream, 5000);
        };
    } catch (err) {
        console.error('Failed to initialize vote stream:', err);
    }
}

