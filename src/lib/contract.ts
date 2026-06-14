// ArcGov — arcgov.vercel.app
import { 
  createPublicClient, 
  http, 
  parseAbi, 
  PublicClient, 
  WalletClient,
  decodeEventLog
} from 'viem';

// Arc Testnet Configuration
const ARC_CHAIN_ID = 5042002;
const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
import type { Proposal } from '@/types';
import { withRetry } from '@/lib/retry';
export const ARC_GOV_CORE_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x6C1c1aB8b4d67C2D39b3d9d9CbF65c72c37fA7Ba') as `0x${string}`;

// Full ABI inline
export const ARC_GOV_CORE_ABI = parseAbi([
  "struct Proposal { uint256 id; string title; string description; uint8 category; string ipfsHash; address proposer; uint256 createdAt; uint256 votingDeadline; uint256 forVotes; uint256 againstVotes; uint256 abstainVotes; bool isOpen; }",
  "function submitProposal(string title, string description, uint8 category, string ipfsHash, uint256 votingDuration) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 voteType) returns (bool)",
  "function closeProposal(uint256 proposalId) returns (bool)",
  "function getProposal(uint256 id) view returns (Proposal)",
  "function getAllProposals() view returns (Proposal[])",
  "function hasVotedOn(uint256 proposalId, address voter) view returns (bool)",
  "function getProposalCount() view returns (uint256)",
  "function getVoterChoice(uint256 proposalId, address voter) view returns (uint8)",
  "event ProposalCreated(uint256 indexed id, address indexed proposer, string title, uint8 category, uint256 votingDeadline)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 voteType, uint256 newForVotes, uint256 newAgainstVotes, uint256 newAbstainVotes)",
  "event ProposalExecuted(uint256 indexed id, bool passed, uint256 forVotes, uint256 againstVotes)"
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
export async function getAllProposals(): Promise<Proposal[]> {
  try {
    const proposals = await withRetry(() =>
      publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ARCGovCoreABI,
        functionName: 'getAllProposals',
      })
    );
    return proposals as Proposal[];
  } catch (error) {
    console.error('Error in getAllProposals:', error);
    return [];
  }
}

/**
 * Fetches a single proposal by ID
 */
export async function getProposal(id: number): Promise<Proposal | null> {
  try {
    const proposal = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'getProposal',
      args: [BigInt(id)],
    });
    return proposal as Proposal;
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
 * Submits a new proposal to the contract.
 *
 * @param votingDurationSeconds Length of the voting window in seconds. This is
 *   set on-chain as `block.timestamp + votingDurationSeconds`, so the deadline
 *   the UI shows is exactly the one the contract enforces (no more 7-day-only
 *   votes silently expiring on "30-day" proposals). Defaults to 7 days.
 * Returns { hash, proposalId }
 */
export async function submitProposal(
  title: string,
  description: string,
  category: number,
  walletClient: WalletClient,
  publicClientForWrite: PublicClient,
  votingDurationSeconds: number = 7 * 24 * 60 * 60
): Promise<{ hash: `0x${string}`, proposalId: number }> {
  try {
    const [address] = await walletClient.getAddresses();
    const { request } = await publicClientForWrite.simulateContract({
      account: address,
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'submitProposal',
      args: [title, description, category, "", BigInt(Math.round(votingDurationSeconds))], // ipfsHash left empty
    });
    
    const hash = await walletClient.writeContract(request);
    
    // Wait for receipt to extract proposalId from event
    const receipt = await publicClientForWrite.waitForTransactionReceipt({ hash });
    
    // Parse ProposalCreated event
    const logs = receipt.logs;
    let proposalId = 0;
    
    for (const log of logs) {
      try {
        const event = decodeEventLog({
          abi: ARCGovCoreABI,
          data: log.data,
          topics: log.topics,
          eventName: 'ProposalCreated'
        });
        if (event.eventName === 'ProposalCreated') {
          proposalId = Number((event.args as any).id);
          break;
        }
      } catch (e) {
        // Skip logs that don't match
      }
    }

    return { hash, proposalId };
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

/**
 * Closes a proposal after its voting deadline (the "execution" step).
 * Anyone can call this once voting has ended; the contract records whether
 * the proposal passed (quorum reached AND more FOR than AGAINST).
 *
 * NOTE: this requires the updated ArcGovCore contract to be deployed. See
 * ONCHAIN.md for deploy steps. Calling it against the current deployment will
 * revert until you redeploy.
 */
export async function closeProposal(
  proposalId: number,
  walletClient: WalletClient,
  publicClientForWrite: PublicClient
) {
  try {
    const [address] = await walletClient.getAddresses();
    const { request } = await publicClientForWrite.simulateContract({
      account: address,
      address: CONTRACT_ADDRESS,
      abi: ARCGovCoreABI,
      functionName: 'closeProposal',
      args: [BigInt(proposalId)],
    });
    const hash = await walletClient.writeContract(request);
    return hash;
  } catch (error) {
    console.error('Error in closeProposal:', error);
    throw error;
  }
}
