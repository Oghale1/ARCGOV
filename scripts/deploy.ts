import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ArcGovCore to Arc Testnet...");

  const ArcGovCore = await ethers.getContractFactory("ArcGovCore");
  const arcGovCore = await ArcGovCore.deploy();

  await arcGovCore.waitForDeployment();

  const address = await arcGovCore.getAddress();

  console.log(`ArcGovCore deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
