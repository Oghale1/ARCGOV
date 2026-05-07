const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ArcGovCore to Arc Testnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(
    deployer.address
  );
  console.log("Account balance:", 
    ethers.formatEther(balance), "USDC");

  const ArcGovCore = await ethers.getContractFactory(
    "ArcGovCore"
  );
  const arcGovCore = await ArcGovCore.deploy();
  await arcGovCore.waitForDeployment();

  const address = await arcGovCore.getAddress();
  console.log("✅ ArcGovCore deployed to:", address);
  console.log("Arc Testnet explorer:", 
    "https://testnet.arcscan.app/address/" + address);
  console.log("");
  console.log("IMPORTANT: Copy this address into your");
  console.log(".env.local file as:");
  console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=" + address);
  
  // Save address to file
  const fs = require("fs");
  if (!fs.existsSync("./data")) {
    fs.mkdirSync("./data");
  }
  const deployment = {
    network: "arc-testnet",
    chainId: 5042002,
    contractName: "ArcGovCore",
    address: address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };
  fs.writeFileSync(
    "./data/deployment.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log("✅ Saved to /data/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
