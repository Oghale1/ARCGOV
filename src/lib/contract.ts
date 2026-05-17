// ArcGov — arcgov.vercel.app
import { 
  createPublicClient, 
  http, 
  parseAbi, 
  PublicClient, 
  WalletClient 
} from 'viem';

// Arc Testnet Configuration
const ARC_CHAIN_ID = 5042002;
const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
export const ARC_GOV_CORE_ADDRESS = '0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99' as `0x${string}`;

// Full ABI inline
export const ARC_GOV_CORE_ABI = parseAbi([
  "struct Proposal { uint256 id; string title; string description; uint8 category; string ipfsHash; address proposer; uint256 createdAt; uint256 votingDeadline; uint256 forVotes; uint256 againstVotes; uint256 abstainVotes; bool isOpen; }",
  "function submitProposal(string title, string description, uint8 category, string ipfsHash) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 voteType) returns (bool)",
  "function getProposal(uint256 id) view returns (Proposal)",
  "function getAllProposals() view returns (Proposal[])",
  "function hasVotedOn(uint256 proposalId, address voter) view returns (bool)",
  "function getProposalCount() view returns (uint256)",
  "function getVoterChoice(uint256 proposalId, address voter) view returns (uint8)",
  "event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint8 category, uint256 votingDeadline)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 voteType, uint256 newForVotes, uint256 newAgainstVotes, uint256 newAbstainVotes)"
]);

// Deprecated aliases for backward compatibility if any
export const ARCGovCoreABI = ARC_GOV_CORE_ABI;
const CONTRACT_ADDRESS = ARC_GOV_CORE_ADDRESS;

// Initialize Public Client
const publicClient = createPublicClient({
  transport: http(ARC_RPC_URL),
});

/**
 * Fetches all proposals from the contract
 */
export async function getAllProposals(): Promise<any[]> {
  try {
    const proposals = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'getAllProposals',
    });
    return proposals as any[];
  } catch (error) {
    console.error('Error in getAllProposals:', error);
    return [];
  }
}

/**
 * Fetches a single proposal by ID
 */
export async function getProposal(id: number): Promise<any> {
  try {
    const proposal = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'getProposal',
      args: [BigInt(id)],
    });
    return proposal;
  } catch (error) {
    console.error(`Error in getProposal(${id}):`, error);
    return null;
  }
}

/**
 * Returns the total number of proposals
 */
export async function getProposalCount(): Promise<number> {
  try {
    const count = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'getProposalCount',
    });
    return Number(count);
  } catch (error) {
    console.error('Error in getProposalCount:', error);
    return 0;
  }
}

/**
 * Checks if an address has voted on a specific proposal
 */
export async function hasVoted(proposalId: number, address: string): Promise<boolean> {
  if (!address || !address.startsWith('0x')) return false;
  try {
    const voted = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'hasVotedOn',
      args: [BigInt(proposalId), address as `0x${string}`],
    });
    return voted as boolean;
  } catch (error) {
    console.error(`Error in hasVoted(${proposalId}):`, error);
    return false;
  }
}

/**
 * Returns the specific vote choice made by a voter on a proposal
 * Returns 0=FOR, 1=AGAINST, 2=ABSTAIN
 */
export async function getVoterChoice(proposalId: number, address: string): Promise<number> {
  if (!address || !address.startsWith('0x')) return 0;
  try {
    const choice = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'getVoterChoice',
      args: [BigInt(proposalId), address as `0x${string}`],
    });
    return Number(choice);
  } catch (error) {
    console.error(`Error in getVoterChoice(${proposalId}):`, error);
    return 0;
  }
}

/**
 * Submits a new proposal to the contract
 */
export async function submitProposal(
  title: string,
  description: string,
  category: number,
  walletClient: WalletClient,
  publicClientForWrite: PublicClient
) {
  try {
    const [address] = await walletClient.getAddresses();
    const { request } = await publicClientForWrite.simulateContract({
      account: address,
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'submitProposal',
      args: [title, description, category, ""], // ipfsHash left empty as per basic requirement
    });
    const hash = await walletClient.writeContract(request);
    return hash;
  } catch (error) {
    console.error('Error in submitProposal:', error);
    throw error;
  }
}

/**
 * Casts a vote on a proposal
 * voteType: 0=FOR, 1=AGAINST, 2=ABSTAIN
 */
export async function castVote(
  proposalId: number,
  voteType: number,
  walletClient: WalletClient,
  publicClientForWrite: PublicClient
) {
  try {
    const [address] = await walletClient.getAddresses();
    const { request } = await publicClientForWrite.simulateContract({
      account: address,
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'castVote',
      args: [BigInt(proposalId), voteType],
    });
    const hash = await walletClient.writeContract(request);
    return hash;
  } catch (error) {
    console.error('Error in castVote:', error);
    throw error;
  }
}
