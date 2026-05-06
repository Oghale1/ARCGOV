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
const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// Full ABI inline
export const ARCGovCoreABI = parseAbi([
  "function submitProposal(string title, string description, uint8 category, string ipfsHash) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 voteType) returns (bool)",
  "function getProposal(uint256 id) view returns (uint256 id, string title, string description, uint8 category, address proposer, uint256 timestamp, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool isOpen)",
  "function getAllProposals() view returns (tuple(uint256 id, string title, string description, uint8 category, address proposer, uint256 timestamp, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool isOpen)[])",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function getProposalCount() view returns (uint256)",
  "event ProposalCreated(uint256 indexed id, address indexed proposer, string title)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 voteType)"
]);

// Initialize Public Client
const publicClient = createPublicClient({
  transport: http(ARC_RPC_URL),
});

/**
 * Fetches all proposals from the contract
 */
export async function getAllProposals() {
  try {
    const proposals = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'getAllProposals',
    });
    return proposals;
  } catch (error) {
    console.error('Error in getAllProposals:', error);
    return [];
  }
}

/**
 * Fetches a single proposal by ID
 */
export async function getProposal(id: number) {
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
      functionName: 'hasVoted',
      args: [BigInt(proposalId), address as `0x${string}`],
    });
    return voted;
  } catch (error) {
    console.error(`Error in hasVoted(${proposalId}):`, error);
    return false;
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
