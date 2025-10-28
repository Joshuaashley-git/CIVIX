# 🗳️ Civix – Full Stack (Backend, Admin Panel, Frontend)

A blockchain voting system consisting of:
- Backend API (Express) for smart contract integration
- Admin Panel (Express + static UI) for election/candidate management and live votes
- Frontend (Vite + React) for voters

## Quick Start (Full Stack)

Prerequisites
- Node.js 18+ and npm
- Free ports: 8545, 5001, 3001, 8080

1) Terminal A — Hardhat blockchain
```
cd "Civix Backend"
npx hardhat node
```

2) Terminal B — Deploy contract to localhost
```
cd "Civix Backend"
npx hardhat run scripts/deploy.js --network localhost
```

3) Terminal C — Backend API (port 5001)
```
cd "Civix Backend"
npm run dev
```

4) Terminal D — Admin Panel (port 3001)
```
cd "Civix Admin Panel"
npm start
```

5) Terminal E — Frontend (port 8080)
```
cd "Civix frontend"
npm run dev
```

Open
- Admin Panel: http://localhost:3001
- Frontend: http://localhost:8080
- Backend Health: http://localhost:5001/api/health

Realtime
- Votes stream to Admin Panel via SSE: /api/admin/vote-stream
- Candidate edits/removals stream to Frontend via SSE: /api/admin/candidate-stream

Persistence
- UI-level candidate edits/removals persist in file: Civix Admin Panel/data/admin-store.json
- Override via env var `DB_PATH` if desired

## Features

- ✅ **Smart Contract-based Voting**: Secure, transparent, and immutable voting system
- 🔐 **Admin Panel**: Real-time vote counting and election management
- 📊 **Live Results**: Real-time vote tracking and analytics
- 🛡️ **Security**: Built-in voter ID verification and duplicate vote prevention
- ⛓️ **Blockchain Integration**: Works with local Hardhat network or Ethereum testnets

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Blockchain    │
│   (React)       │◄───│   (Node.js)     │◄───│   (Ethereum)    │
│                 │    │                 │    │                 │
│ - Voting UI     │    │ - REST API      │    │ - Smart Contract│
│ - Admin Panel   │    │ - Auth          │    │ - Vote Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Blockchain
```bash
# Terminal 1: Start Hardhat local blockchain
npm run node
```

### 3. Deploy Smart Contract
```bash
# Terminal 2: Deploy the voting contract
npm run compile
npm run deploy
```

### 4. Start Backend API
```bash
# Terminal 3: Start the API server
npm run dev
```

### 5. Open Admin Panel
```bash
# Open in browser
open http://localhost:3001
```

The admin panel will be available at `http://localhost:3001` with:
- **Login**: admin@civix.com
- **Password**: admin123

## API Endpoints

### Public Endpoints
- `GET /api/health` - API health check
- `GET /api/elections` - Get all elections
- `GET /api/elections/:id` - Get specific election
- `GET /api/elections/:id/candidates` - Get election candidates
- `POST /api/votes` - Cast a vote

### Admin Endpoints (Requires `Authorization: Bearer admin-token`)
- `GET /api/admin/dashboard` - Dashboard overview
- `GET /api/admin/results` - All election results
- `GET /api/admin/elections/:id/results` - Specific election results
- `GET /api/admin/elections/:id/live-results` - Real-time results
- `POST /api/admin/elections` - Create new election
- `POST /api/admin/elections/:id/candidates` - Add candidate

### Authentication
- `POST /api/auth/admin/login` - Admin login

## Smart Contract Functions

### Core Functions
- `createElection()` - Create new election (admin only)
- `addCandidate()` - Add candidate to election (admin only)
- `castVote()` - Cast a vote (public)
- `getElectionResults()` - Get election results (public)

### Security Features
- Voter ID hash verification
- One vote per voter per election
- Time-based election windows
- Emergency pause/unpause functionality

## Project Structure

```
civix-backend/
├── contracts/               # Smart contracts
│   └── CivixVoting.sol     # Main voting contract
├── scripts/                # Deployment scripts
│   └── deploy.js           # Contract deployment
├── server/                 # Backend API
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── index.js           # Main server file
├── admin-panel/           # Admin dashboard
│   └── public/
│       └── index.html     # Admin panel UI
├── test/                  # Contract tests
├── artifacts/             # Compiled contracts
├── deployment.json        # Deployment info
└── .env                   # Environment config
```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Credentials
ADMIN_EMAIL=admin@civix.com
ADMIN_PASSWORD=admin123

# Production Blockchain (optional)
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
```

## Scripts

```bash
# Development
npm run dev          # Start API server with auto-reload
npm run node         # Start local blockchain
npm run compile      # Compile smart contracts
npm run deploy       # Deploy contracts to local network

# Testing
npm test            # Run contract tests

# Production
npm start           # Start production server
```

## Usage Examples

### Creating an Election (Admin)
```javascript
const response = await fetch('/api/admin/elections', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer admin-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "2024 Presidential Election",
    description: "Choose the next president",
    startTime: "2024-11-01T08:00:00Z",
    endTime: "2024-11-01T20:00:00Z"
  })
});
```

### Casting a Vote
```javascript
const response = await fetch('/api/votes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    electionId: 1,
    candidateId: 2,
    voterIdHash: "hashed_voter_id_string"
  })
});
```

### Getting Live Results
```javascript
const response = await fetch('/api/admin/elections/1/live-results', {
  headers: {
    'Authorization': 'Bearer admin-token'
  }
});
```

## Admin Panel Features

The admin panel provides:

1. **📊 Dashboard Overview**
   - Total elections count
   - Total votes cast across all elections
   - Blockchain connection status

2. **📋 Election Management**
   - View all elections with status
   - Real-time vote counts
   - Election details and results

3. **🔄 Real-time Updates**
   - Auto-refresh every 30 seconds
   - Manual refresh option
   - Live blockchain status monitoring

## Security Considerations

1. **Smart Contract Security**
   - ReentrancyGuard protection
   - Access control with OpenZeppelin
   - Emergency pause functionality

2. **API Security**
   - Admin authentication required
   - Rate limiting (recommended for production)
   - Input validation

3. **Voting Security**
   - Voter ID hashing
   - One vote per voter enforcement
   - Time-based election windows

## Production Deployment

1. **Deploy to Testnet/Mainnet**
   ```bash
   # Set environment variables
   export PRIVATE_KEY="your_private_key"
   export SEPOLIA_RPC_URL="your_rpc_url"
   
   # Deploy to Sepolia testnet
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Update Environment**
   - Set production environment variables
   - Configure proper authentication
   - Set up HTTPS and security headers

3. **Frontend Integration**
   - Update API endpoints in frontend
   - Configure Web3 provider for production
   - Set contract addresses

## Troubleshooting

### Common Issues

1. **"Contract not deployed" Error**
   ```bash
   # Make sure blockchain is running
   npm run node
   # Deploy the contract
   npm run deploy
   ```

2. **"Failed to connect to blockchain"**
   - Check if Hardhat node is running on port 8545
   - Verify RPC URL in environment variables

3. **Admin panel shows "Disconnected"**
   - Ensure API server is running on port 5000
   - Check CORS configuration for admin panel

### Logs and Debugging

- API logs: Check terminal running `npm run dev`
- Blockchain logs: Check terminal running `npm run node`
- Contract events: Monitor transaction receipts in API responses

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API endpoint documentation
3. Verify smart contract deployment
4. Check environment configuration

## License

MIT License - see LICENSE file for details.
