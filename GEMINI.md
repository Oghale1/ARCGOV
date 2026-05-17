# ArcGov Project Standards & Roadmap

This document serves as the foundational mandate for the ArcGov project.

## Project Vision
ArcGov is the first community-driven governance dashboard for the Arc blockchain. It provides transparency into validator performance, proposal status, and network health.

## Engineering Standards
- **Framework**: Next.js (App Router) with TypeScript.
- **Styling**: Tailwind CSS for utility-first styling.
- **State Management**: React hooks (useState, useMemo, useCallback) with Wagmi for blockchain state.
- **Blockchain**: Viem for contract interactions, Hardhat for local development and testing.
- **Backend**: Supabase for non-chain data (feedback, notifications, interests).
- **AI**: Gemini 1.5 Flash for proposal summarization and automated insights.

## Supabase Requirements
The `scripts/setup-db.ts` script expects a Supabase RPC function named `exec_sql` to execute raw SQL. 
SQL to create this function in the Supabase SQL Editor:
```sql
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
```

## Coding Style
- **Type Safety**: Avoid `any` where possible. Use explicit interfaces for data models (e.g., Proposals, Validators).
- **Hooks**: Always include exhaustive dependencies in `useEffect`. Wrap data-fetching logic in `useCallback`.
- **Components**: Prefer functional components and composition over inheritance.
- **Naming**: CamelCase for files and components, kebab-case for CSS classes.

## Roadmap
- [x] Initial build stability (Fixed all type errors and missing imports).
- [x] Linting compliance (Configured ESLint and resolved all violations).
- [x] Smart Contract verification (All 25 Hardhat tests passing).
- [ ] Comprehensive documentation (Flesh out README.md).
- [ ] Supabase production setup (Verify table schemas and migrations).
- [ ] Vercel deployment (Optimize for production and edge runtime).
- [ ] Enhanced AI features (Context-aware governance analytics).

## Subdirectory Guidance
- `./contracts`: Smart contract source and tests.
- `./src/app`: Next.js pages and layouts.
- `./src/components`: Reusable UI components.
- `./src/lib`: Logic for contract interaction and external APIs.
