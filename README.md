# ArcGov — Community Governance for Arc Blockchain

ArcGov is a comprehensive dashboard and governance platform designed specifically for the Arc blockchain. It empowers the community to track validator performance, participate in protocol decisions, and build on a transparent, institutional-grade infrastructure.

## 🚀 Key Features

- **Governance Dashboard**: Vote on AIPs (Arc Improvement Proposals) and track real-time voting tallies.
- **Validator Insights**: Comprehensive uptime, commission, and location tracking for institutional validators.
- **Quantum Readiness**: Monitor the network's progress toward post-quantum cryptographic security.
- **AI-Powered Insights**: Automated proposal summarization using Gemini 1.5 Flash.
- **On-Chain Verification**: Direct integration with Arc Testnet for transparent, verifiable data.
- **Developer Tools**: Dedicated portal for "Architects" (builders) within the ecosystem.

## 🛠️ Technology Stack

- **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/)
- **Blockchain**: [Viem](https://viem.sh/), [Wagmi](https://wagmi.sh/), [Hardhat](https://hardhat.org/)
- **Backend**: [Supabase](https://supabase.com/) (Feedback & Notifications)
- **AI**: [Google Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Arc Testnet account (with some tUSDC for gas)

### Installation
1.  **Clone the repo**:
    ```bash
    git clone https://github.com/arcgov/arcgov.git
    cd arcgov
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Copy `.env.local.example` to `.env.local` and fill in your keys:
    ```bash
    cp .env.local.example .env.local
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

### 🗄️ Database Setup
The project uses Supabase for storing form submissions (validator applications,
staking waitlist, architect applications, feedback, quantum subscribers,
proposal metadata, and dashboard notification preferences).

**Run the migration** — the schema lives in one file:
`supabase/migrations/0001_arcgov_init.sql`

Either:
- **By hand (recommended):** open Supabase → SQL Editor → New query, paste the
  file's contents, and click **Run**. It is idempotent (safe to re-run).
- **Via script:** `npx ts-node scripts/setup-db.ts` (requires
  `SUPABASE_SERVICE_ROLE_KEY` and an `exec_sql` RPC — the script prints the
  manual steps if that RPC isn't set up).

Without this migration the forms will fail with a "table missing" error.

## 🧪 Testing

Run the smart contract test suite:
```bash
npx hardhat test
```

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ by the Arc community.*
