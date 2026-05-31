// ArcGov — arcgov.vercel.app
// Single source of truth for a proposal's lifecycle state.
//
// The on-chain `isOpen` flag alone is NOT enough to tell whether a proposal is
// still live: it stays `true` until someone calls `closeProposal()`, which only
// happens *after* the voting deadline. So a proposal whose deadline has already
// passed can still report `isOpen === true` on-chain. To decide the *current*
// state we combine `isOpen` with the effective deadline.
//
// States (matches ArcGovCore's quorum + majority rule):
//   - Active   : voting is still open (isOpen AND deadline in the future)
//   - Passed   : voting ended, quorum reached AND more FOR than AGAINST
//   - Rejected : voting ended, quorum reached, but NOT in favour
//                (AGAINST > FOR — i.e. voted down, including abstain-led results)
//   - Failed   : voting ended without a decisive result
//                (below quorum, or a neutral FOR = AGAINST tie)

/** Minimum total votes for a proposal to be able to pass / be decisively rejected. Mirrors ArcGovCore.QUORUM. */
export const QUORUM = 5;

export type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Rejected';

/** Minimal shape we need to derive status + voting window. Works with on-chain
 *  proposals and the metadata-merged variant (which adds `customStart` /
 *  `customDeadline`). */
export interface ProposalLike {
  isOpen: boolean;
  createdAt?: bigint | number;
  votingDeadline: bigint | number;
  customStart?: Date | string | null;
  customDeadline?: Date | string | null;
  forVotes: bigint | number;
  againstVotes: bigint | number;
  abstainVotes: bigint | number;
}

/**
 * The deadline we actually display/act on. An off-chain `customDeadline`
 * (stored in Supabase) takes precedence; otherwise we fall back to the
 * on-chain `votingDeadline` (a unix-seconds value).
 */
export function getEffectiveDeadline(p: ProposalLike): Date {
  if (p.customDeadline) {
    return p.customDeadline instanceof Date ? p.customDeadline : new Date(p.customDeadline);
  }
  return new Date(Number(p.votingDeadline) * 1000);
}

/**
 * When voting opened. Prefers an off-chain `customStart` override; otherwise
 * falls back to the on-chain `createdAt` (unix-seconds submission time), which
 * is the real moment voting became live.
 */
export function getVotingStart(p: ProposalLike): Date {
  if (p.customStart) {
    return p.customStart instanceof Date ? p.customStart : new Date(p.customStart);
  }
  return new Date(Number(p.createdAt ?? 0) * 1000);
}

/** True only while the proposal is genuinely accepting votes. */
export function isVotingActive(p: ProposalLike, now: number = Date.now()): boolean {
  if (!p.isOpen) return false;
  return getEffectiveDeadline(p).getTime() > now;
}

/** Whether voting has finished (deadline passed or already closed on-chain). */
export function hasVotingEnded(p: ProposalLike, now: number = Date.now()): boolean {
  return !isVotingActive(p, now);
}

/** Did the proposal meet quorum AND get more FOR than AGAINST votes? */
export function didProposalPass(p: ProposalLike): boolean {
  const forVotes = Number(p.forVotes);
  const againstVotes = Number(p.againstVotes);
  const total = forVotes + againstVotes + Number(p.abstainVotes);
  return total >= QUORUM && forVotes > againstVotes;
}

/**
 * The proposal's current state. 'Active' while voting; once voting ends:
 *   - 'Passed'   : quorum reached AND FOR > AGAINST
 *   - 'Rejected' : quorum reached but FOR did NOT win (voted down / abstain-led)
 *   - 'Failed'   : below quorum, or a neutral FOR = AGAINST tie
 */
export function getProposalStatus(p: ProposalLike, now: number = Date.now()): ProposalStatus {
  if (isVotingActive(p, now)) return 'Active';
  if (didProposalPass(p)) return 'Passed';

  const forVotes = Number(p.forVotes);
  const againstVotes = Number(p.againstVotes);
  const total = forVotes + againstVotes + Number(p.abstainVotes);

  if (total < QUORUM) return 'Failed';        // not enough participation to decide
  if (forVotes === againstVotes) return 'Failed'; // neutral tie
  return 'Rejected';                           // quorum met, FOR did not win
}
