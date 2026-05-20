// ArcGov — arcgov.vercel.app
import { createPublicClient, http, formatUnits, erc20Abi } from 'viem';

// Arc Testnet Configuration
const ARC_CHAIN_ID = 5042002;
const ARC_RPC_URL = 'https://rpc.testnet.arc.network';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const publicClient = createPublicClient({
  transport: http(ARC_RPC_URL),
});

export interface NetworkStats {
  blockNumber: string;
  finality: string;
  totalValidators: number;
  networkName: string;
}

/**
 * Gets the current block number from Arc Testnet
 * @returns BigInt block number
 */
export async function getBlockNumber(): Promise<bigint | null> {
  try {
    return await publicClient.getBlockNumber();
  } catch (error) {
    console.error('Error fetching block number:', error);
    return null;
  }
}

/**
 * Gets the current block number as a formatted string
 */
export async function getBlockNumberFormatted(): Promise<string> {
  const block = await getBlockNumber();
  return block ? block.toLocaleString() : "0";
}

/**
 * Returns general network statistics for Arc Testnet
 */
export async function getNetworkStats(): Promise<NetworkStats> {
  try {
    const blockNumber = await getBlockNumberFormatted();
    return {
      blockNumber,
      finality: "~0.78s",
      totalValidators: 8,
      networkName: "Arc Testnet",
    };
  } catch (error) {
    return {
      blockNumber: "0",
      finality: "~0.78s",
      totalValidators: 8,
      networkName: "Arc Testnet",
    };
  }
}

/**
 * Fetches USDC balance for a given address on Arc Testnet
 * @param address Wallet address to check
 * @returns Formatted USDC balance string (6 decimals)
 */
export async function getUSDCBalance(address: string): Promise<string> {
  if (!address || !address.startsWith('0x')) return "0.00";

  try {
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    // USDC on Arc uses 6 decimals
    const formatted = formatUnits(balance, 6);
    return parseFloat(formatted).toFixed(2);
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    return "0.00";
  }
}

/**
 * Checks if the provided chain ID is Arc Testnet
 */
export function isArcTestnet(chainId: number): boolean {
  return chainId === ARC_CHAIN_ID;
}
