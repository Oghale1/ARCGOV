/**
 * Blockscout REST API for Arc Testnet.
 * Validator addresses in validators.json are currently placeholders. 
 * When Circle publishes official validator node addresses, update 
 * validators.json validatorAddress fields and this library will 
 * automatically show live data.
 */

const BASE_URL = 'https://testnet.arcscan.app/api/v2';

export interface NetworkStats {
  totalBlocks: string;
  totalTransactions: string;
  averageBlockTime: string;
  totalAddresses: string;
}

export interface RecentBlock {
  number: number;
  timestamp: string;
  transactionCount: number;
  miner: string;
  gasUsed: string;
}

export interface ValidatorActivity {
  blocksProduced: number;
  lastActiveBlock: number | null;
  isRecentlyActive: boolean;
}

export interface AddressStats {
  transactionCount: number;
  tokenTransferCount: number;
  isContract: boolean;
}

/**
 * Fetches general network statistics from Arc Testnet
 */
export async function getNetworkStats(): Promise<NetworkStats> {
  try {
    const response = await fetch(`${BASE_URL}/stats`);
    if (!response.ok) throw new Error('Network stats fetch failed');
    const data = await response.json();
    
    return {
      totalBlocks: data.total_blocks?.toLocaleString() || "—",
      totalTransactions: data.total_transactions?.toLocaleString() || "—",
      averageBlockTime: `${(data.average_block_time / 1000).toFixed(2)}s` || "—",
      totalAddresses: data.total_addresses?.toLocaleString() || "—",
    };
  } catch (error) {
    return {
      totalBlocks: "—",
      totalTransactions: "—",
      averageBlockTime: "—",
      totalAddresses: "—",
    };
  }
}

/**
 * Returns the total number of blocks validated by a specific address
 */
export async function getBlocksValidatedByAddress(address: string): Promise<number> {
  if (!address || !address.startsWith('0x')) return 0;
  try {
    const response = await fetch(`${BASE_URL}/addresses/${address}/blocks-validated?limit=1`);
    if (!response.ok) return 0;
    const data = await response.json();
    return data.total_count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Fetches a list of the most recent blocks on the network
 */
export async function getRecentBlocks(limit: number): Promise<RecentBlock[]> {
  try {
    const response = await fetch(`${BASE_URL}/blocks?type=block&limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    
    return data.items.map((item: any) => ({
      number: item.height || item.number,
      timestamp: item.timestamp,
      transactionCount: item.tx_count || item.transaction_count || 0,
      miner: item.miner?.hash || item.miner || "Unknown",
      gasUsed: item.gas_used?.toLocaleString() || "0",
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Derives activity metrics for a validator based on on-chain data
 */
export async function deriveValidatorActivity(
  validatorAddress: string
): Promise<ValidatorActivity> {
  const fallback = { blocksProduced: 0, lastActiveBlock: null, isRecentlyActive: false };
  if (!validatorAddress || !validatorAddress.startsWith('0x')) return fallback;

  try {
    const [blocksProduced, stats, lastBlockRes] = await Promise.all([
      getBlocksValidatedByAddress(validatorAddress),
      fetch(`${BASE_URL}/stats`).then(r => r.json()),
      fetch(`${BASE_URL}/addresses/${validatorAddress}/blocks-validated?limit=1&sort=desc`).then(r => r.json())
    ]);

    const currentBlock = parseInt(stats.total_blocks || "0");
    const lastBlockItem = lastBlockRes.items?.[0];
    const lastActiveBlock = lastBlockItem ? (lastBlockItem.height || lastBlockItem.number) : null;
    
    let isRecentlyActive = false;
    if (lastActiveBlock && currentBlock > 0) {
      isRecentlyActive = (currentBlock - lastActiveBlock) <= 1000;
    }

    return {
      blocksProduced,
      lastActiveBlock,
      isRecentlyActive
    };
  } catch (error) {
    return fallback;
  }
}

/**
 * Fetches transaction and contract metadata for any address
 */
export async function getAddressStats(address: string): Promise<AddressStats> {
  const fallback = { transactionCount: 0, tokenTransferCount: 0, isContract: false };
  if (!address || !address.startsWith('0x')) return fallback;

  try {
    const response = await fetch(`${BASE_URL}/addresses/${address}`);
    if (!response.ok) return fallback;
    const data = await response.json();

    return {
      transactionCount: data.transactions_count || 0,
      tokenTransferCount: data.token_transfers_count || 0,
      isContract: data.is_contract || false,
    };
  } catch (error) {
    return fallback;
  }
}

/**
 * A proxy function that bridges static data with live activity checks
 */
export async function buildNetworkUptimeProxy(
  validatorAddress: string,
  staticUptime: number
): Promise<number> {
  try {
    const liveCount = await getBlocksValidatedByAddress(validatorAddress);
    // If liveCount > 0, the address is an active validator.
    // If liveCount is 0, it's likely a placeholder.
    // In both cases, we currently return the staticUptime as specified.
    return staticUptime;
  } catch (error) {
    return staticUptime;
  }
}
