# Civix Admin Panel - Run Instructions

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

## Step-by-Step Setup

### 1. Start the Local Blockchain Network
```bash
cd "/Users/ashley/Documents/CIVIX/Civix Backend"
npx hardhat node
```
**Keep this terminal open** - this runs the local blockchain on port 8545.

### 2. Deploy the Smart Contract
Open a **new terminal** and run:
```bash
cd "/Users/ashley/Documents/CIVIX/Civix Backend"
npx hardhat run scripts/deploy.js --network localhost
```
This deploys the CivixVoting contract and creates sample election data.

### 3. Start the Backend API Server
In the **same terminal** (or a new one):
```bash
cd "/Users/ashley/Documents/CIVIX/Civix Backend"
PORT=5001 npm start
```
**Keep this terminal open** - this runs the API server on port 5001.

### 4. Start the Admin Panel Frontend
Open a **new terminal** and run:
```bash
cd "/Users/ashley/Documents/CIVIX/Civix Backend/admin-panel"
npm start
```
**Keep this terminal open** - this runs the React app on port 3000.

## Access Points

- **Admin Panel**: http://localhost:3000
- **API Health Check**: http://localhost:5001/api/health
- **Blockchain Node**: http://localhost:8545

## What You'll See

✅ **Dashboard**: System overview with statistics
✅ **Election Management**: Create and manage elections
✅ **Candidate Management**: Add/remove candidates
✅ **Results**: View election results and vote history
✅ **Blockchain Status**: Connected (green indicator)

## Troubleshooting

### If you see "API Disconnected":
1. Make sure the backend server is running on port 5001
2. Check that the blockchain node is running on port 8545
3. Verify the contract was deployed successfully

### If you see "Blockchain Disconnected":
1. Ensure Hardhat node is running: `npx hardhat node`
2. Redeploy the contract: `npx hardhat run scripts/deploy.js --network localhost`

### Port Conflicts:
- If port 3000 is busy, React will ask to use a different port
- If port 5001 is busy, change the PORT environment variable
- If port 8545 is busy, stop other Hardhat instances

## Quick Commands Reference

```bash
# Start blockchain (Terminal 1)
cd "/Users/ashley/Documents/CIVIX/Civix Backend"
npx hardhat node

# Deploy contract (Terminal 2)
cd "/Users/ashley/Documents/CIVIX/Civix Backend"
npx hardhat run scripts/deploy.js --network localhost

# Start backend (Terminal 2 or 3)
cd "/Users/ashley/Documents/CIVIX/Civix Backend"
PORT=5001 npm start

# Start frontend (Terminal 3 or 4)
cd "/Users/ashley/Documents/CIVIX/Civix Backend/admin-panel"
npm start
```

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   Backend API   │    │  Hardhat Node   │
│  (Port 3000)    │◄──►│   (Port 5001)   │◄──►│  (Port 8545)    │
│  Admin Panel    │    │  Express Server │    │  Blockchain     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

All three services must be running for the system to work properly.
