// ArcGov — arcgov.vercel.app
// Shared TypeScript types for the whole app.
// Keeping data shapes in one place means the editor can warn us early
// (e.g. typo in a field name) instead of crashing in the browser.

/**
 * A governance proposal, exactly as the ArcGovCore smart contract returns it.
 * Numbers that come from the chain are `bigint` (very large whole numbers).
 * Use `Number(x)` for maths and `x.toString()` for display.
 */
export interface Proposal {
  id: bigint;
  title: string;
  description: string;
  /** 0 = Validator, 1 = Parameter, 2 = Upgrade, 3 = Ecosystem */
  category: number;
  ipfsHash: string;
  proposer: `0x${string}`;
  createdAt: bigint;
  votingDeadline: bigint;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  isOpen: boolean;
}

/** A proposal plus extra info we store off-chain in Supabase. */
export interface ProposalWithMetadata extends Proposal {
  customDeadline: Date;
}

/** The result of a single vote action (0 = For, 1 = Against, 2 = Abstain). */
export type VoteType = 0 | 1 | 2;

/** One row of a user's voting history (built from on-chain events). */
export interface VoteRecord {
  proposalId: number;
  title: string;
  voteType: number;
  transactionHash: string;
  timestamp: number;
}

/** Quantum-readiness checklist for a validator. */
export interface QuantumChecks {
  postQuantumWallet: boolean;
  privateStateEncryption: boolean;
  signatureHardening: boolean;
}

/**
 * An institutional validator. Today this is loaded from
 * `src/data/validators.json`; see `src/lib/validators.ts` for how to swap in
 * a live data source later without changing any page code.
 */
export interface Validator {
  id: number;
  name: string;
  shortName: string;
  country: string;
  city: string;
  flagEmoji: string;
  uptime: number;
  commission: number;
  totalDelegated: string;
  totalStaked: string;
  selfStake: string;
  blocksValidated: number;
  slashEvents: number;
  quantumStatus: string;
  quantumChecks: QuantumChecks;
  status: string;
  description: string;
  joinedDate: string;
  website: string;
  location: string;
  validatorAddress: string;
}

/** Category helpers shared by every page that renders a proposal. */
export const CATEGORY_LABELS = ['VALIDATOR', 'PARAMETER', 'UPGRADE', 'ECOSYSTEM'] as const;

export const CATEGORY_COLORS: Record<number, string> = {
  0: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
  1: 'text-green-500 bg-green-50 dark:bg-green-900/10',
  2: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
  3: 'text-amber-500 bg-amber-50 dark:bg-amber-900/10',
};
