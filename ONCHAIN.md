# On-Chain Guide (ArcGovCore)

This explains the smart-contract side of ArcGov in plain language, and the
exact steps to deploy the **updated** contract. You only need this when you
want the new "execution / quorum" feature to work on-chain.

## What changed

The contract `contracts/ArcGovCore.sol` was repaired (the old file had a copy-paste
error and would not compile) and gained three things the app already expects:

1. **`hasVotedOn(proposalId, voter)`** and **`getVoterChoice(proposalId, voter)`** —
   read-only helpers the frontend calls. The old deployed contract was missing
   these, which is why those calls quietly returned "false/0".
2. **`closeProposal(proposalId)`** — the "execution" step. After a proposal's
   7-day voting window ends, *anyone* can call this. It locks the result and
   emits a `ProposalExecuted` event.
3. **Quorum** — a proposal only "passes" if it got at least `QUORUM` (currently 5)
   total votes **and** more FOR than AGAINST.

The website talks to the contract through `src/lib/contract.ts`. The new
`closeProposal()` helper is already wired there, ready to use.

## Important: the live site still uses the OLD contract

The app currently points at the already-deployed contract:

```
0x6cFe85E12ED12C619f1bd0240b91ce6f4B2a7d99
```

Your existing proposals and votes are safe and keep working. The new
`closeProposal` feature will only work after you deploy the updated contract
and point the app at the new address. **Deploying is something you do — it
costs a little Arc Testnet gas and creates a new address.**

## How to deploy the updated contract

You need a wallet with some Arc Testnet gas and your private key in `.env.local`
as `DEPLOYER_PRIVATE_KEY` (never commit this file — it's already git-ignored).

```bash
# 1. Install dependencies (also pulls the test runner — see below)
npm install

# 2. Compile + run the contract tests to make sure everything is valid
npx hardhat compile
npx hardhat test

# 3. Deploy to Arc Testnet
npx hardhat run scripts/deploy.js --network arcTestnet
```

The deploy script prints the **new contract address**. Then:

1. Put it in `.env.local`:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourNewAddressHere
   ```
2. Also update `src/data/deployment.json` so it's recorded.
3. Restart the app (`npm run dev`). Done — the app now uses the new contract.

> Tip: a few files still hard-code the old address as a fallback
> (`src/lib/contract.ts`, `src/components/layout/Navbar.tsx`,
> `src/app/my-dashboard/page.tsx`). Search for `0x6cFe85` and update those too
> if you want the new address everywhere.

## What is still NOT on-chain (future work)

- **Token-weighted voting / staking-based delegation.** Right now "delegation"
  is an off-chain *interest list* (stored in Supabase) so users get notified
  when staking launches. Real on-chain delegation needs a token contract plus a
  staking contract, which is a separate, larger project.

## Frontend tests

`npm test` runs the React/TypeScript unit tests (in `src/**/*.test.ts`). The
test runner (Vitest) installs automatically with `npm install`.
