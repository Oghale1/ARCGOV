// One-off launch script: submit AIP-001 as the first live on-chain proposal.
// Run once against the fresh ArcGovCore contract:
//   NODE_OPTIONS="--use-system-ca" npx hardhat run scripts/submit-aip001.js --network arc-testnet
//
// Kept in the repo as a record of how the genesis proposal was created.
const { ethers } = require("hardhat");

// Full proposal text — intentionally WITHOUT the "Reward Rates (proposed)"
// section (removed at launch). Mirrors the copy shown on /governance/aip-001.
const DESCRIPTION = `Summary:
This proposal seeks community approval to launch tARC — the ArcGov community reward token. tARC is a testnet ERC-20 token deployed on Arc Testnet (Chain ID 5042002) with no real monetary value. It exists solely to reward governance participation and build community engagement around ArcGov.

Motivation:
ArcGov needs a mechanism to reward its earliest and most active community members. Governance participation, validator applications, proposal submissions, and consistent voting deserve recognition. tARC provides that recognition in a transparent, on-chain way.

Specification:
Token Name: ArcGov Token
Symbol: tARC
Network: Arc Testnet — Chain ID 5042002
Total Supply: 100,000,000 tARC
Decimals: 18
Monetary Value: None — testnet only
Faucet: 100 tARC claimable free per wallet

Token Allocation:
50% — Community governance rewards
20% — Retroactive early user airdrop
15% — Validator recognition incentives
10% — Builder / founder allocation
5%  — Hackathon and bounty prizes

Timeline:
If AIP-001 passes: tARC deployed within 7 days
If AIP-002 subsequently passes: tARC staking enabled within 14 days of AIP-002 vote close

This proposal does not commit to any financial value for tARC. It is a community coordination and recognition tool only.

Risks:
None significant — testnet token only.
Smart contract risk: contract will be open source and reviewable before deployment.

Vote YES to approve tARC launch.
Vote NO to reject this proposal.`;

const TITLE = "AIP-001: Launch the tARC Community Token";
const CATEGORY = 3; // ECOSYSTEM
const IPFS_HASH = "";
const VOTING_DURATION = 7 * 24 * 60 * 60; // 7 days, in seconds

const ADDRESS_PATH = "./data/deployment.json";

async function main() {
  const fs = require("fs");
  const { address } = JSON.parse(fs.readFileSync(ADDRESS_PATH, "utf8"));
  console.log("Target contract:", address);

  const [signer] = await ethers.getSigners();
  console.log("Submitting from:", signer.address);

  const abi = [
    "function submitProposal(string title, string description, uint8 category, string ipfsHash, uint256 votingDuration) returns (uint256)",
    "function getProposalCount() view returns (uint256)",
    "function getProposal(uint256 id) view returns (tuple(uint256 id, string title, string description, uint8 category, string ipfsHash, address proposer, uint256 createdAt, uint256 votingDeadline, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool isOpen))",
  ];
  const contract = new ethers.Contract(address, abi, signer);

  console.log("Submitting AIP-001 (7-day voting window)...");
  const tx = await contract.submitProposal(TITLE, DESCRIPTION, CATEGORY, IPFS_HASH, VOTING_DURATION);
  console.log("Tx:", tx.hash);
  await tx.wait();

  const count = await contract.getProposalCount();
  const id = Number(count); // newest proposal id == count
  const p = await contract.getProposal(id);
  const deadline = new Date(Number(p.votingDeadline) * 1000);
  console.log("\n✅ AIP-001 submitted as proposal #" + id);
  console.log("   title:    ", p.title);
  console.log("   proposer: ", p.proposer);
  console.log("   isOpen:   ", p.isOpen);
  console.log("   deadline: ", deadline.toISOString(), "(~7 days from now)");
  console.log("   explorer: https://testnet.arcscan.app/address/" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
