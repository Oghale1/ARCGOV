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
//   - Rejected : voting ended without passing AND ABSTAIN was the leading vote
//   - Failed   : voting ended without passing for any other reason
//                (neutral FOR=AGAINST tie, below quorum, or voted down)

/** Minimum total votes for a proposal to be able to pass. Mirrors ArcGovCore.QUORUM. */
export const QUORUM = 5;

export type ProposalStatus = 'Active' | 'Passed' | 'Failed' | 'Rejected';

/** Minimal shape we need to derive status. Works with on-chain proposals and
 *  the metadata-merged variant (which adds `customDeadline`). */
export interface ProposalLike {
  isOpen: boolean;
  votingDeadline: bigint | number;
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

/** True when ABSTAIN is the single largest bucket — the community engaged but
 *  declined to take a side. Used to label a non-passing proposal as "Rejected". */
export function isAbstainLed(p: ProposalLike): boolean {
  const forVotes = Number(p.forVotes);
  const againstVotes = Number(p.againstVotes);
  const abstainVotes = Number(p.abstainVotes);
  return abstainVotes > forVotes && abstainVotes > againstVotes;
}

/**
 * The proposal's current state. 'Active' while voting; once voting ends it is
 * 'Passed' (quorum + majority), 'Rejected' (abstain led the vote), or 'Failed'
 * (neutral tie, below quorum, or voted down).
 */
export function getProposalStatus(p: ProposalLike, now: number = Date.now()): ProposalStatus {
  if (isVotingActive(p, now)) return 'Active';
  if (didProposalPass(p)) return 'Passed';
  return isAbstainLed(p) ? 'Rejected' : 'Failed';
}
