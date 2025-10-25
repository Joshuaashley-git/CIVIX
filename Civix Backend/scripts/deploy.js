const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting Civix Voting Contract deployment...");

  // Get the contract factory
  const CivixVoting = await ethers.getContractFactory("CivixVoting");
  
  // Deploy the contract
  console.log("📄 Deploying CivixVoting contract...");
  const civixVoting = await CivixVoting.deploy();
  
  await civixVoting.waitForDeployment();
  
  console.log("✅ CivixVoting contract deployed to:", await civixVoting.getAddress());
  console.log("🔗 Transaction hash:", civixVoting.deploymentTransaction().hash);
  console.log("⛽ Gas used:", civixVoting.deploymentTransaction().gasLimit.toString());

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, `(Chain ID: ${network.chainId})`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: await civixVoting.getAddress(),
    transactionHash: civixVoting.deploymentTransaction().hash,
    blockNumber: civixVoting.deploymentTransaction().blockNumber?.toString(),
    network: network.name,
    chainId: network.chainId.toString(),
    deployedAt: new Date().toISOString(),
    gasUsed: civixVoting.deploymentTransaction().gasLimit.toString()
  };

  const deploymentPath = path.join(__dirname, '../deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment.json");

  // Optional: Create some sample data for testing
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("🧪 Creating sample election for testing...");
    
    try {
      // Create a test election
      const startTime = Math.floor(Date.now() / 1000) + 60; // Start in 1 minute
      const endTime = startTime + (24 * 60 * 60); // End in 24 hours
      
      const createElectionTx = await civixVoting.createElection(
        "2024 Presidential Election",
        "Choose the next president of the United States",
        startTime,
        endTime
      );
      await createElectionTx.wait();
      console.log("✅ Sample election created with ID: 1");

      // Add sample candidates
      const addCandidate1Tx = await civixVoting.addCandidate(
        1,
        "John Smith",
        "Democratic candidate with focus on healthcare and education"
      );
      await addCandidate1Tx.wait();
      
      const addCandidate2Tx = await civixVoting.addCandidate(
        1,
        "Jane Doe", 
        "Republican candidate with focus on economy and security"
      );
      await addCandidate2Tx.wait();

      const addCandidate3Tx = await civixVoting.addCandidate(
        1,
        "Bob Johnson",
        "Independent candidate with focus on environment and technology"
      );
      await addCandidate3Tx.wait();

      console.log("✅ Sample candidates added:");
      console.log("   1. John Smith (Democratic)");
      console.log("   2. Jane Doe (Republican)");
      console.log("   3. Bob Johnson (Independent)");
      
    } catch (error) {
      console.warn("⚠️  Failed to create sample data:", error.message);
    }
  }

  console.log("🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Start the API server: npm run dev");
  console.log("2. Access admin panel: http://localhost:3001");
  console.log("3. API endpoints available at: http://localhost:5000/api");
  
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log(`4. Verify contract on Etherscan: npx hardhat verify --network ${network.name} ${civixVoting.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });