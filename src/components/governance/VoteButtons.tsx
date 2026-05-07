'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import React, { useState } from 'react';
import { 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useAccount 
} from 'wagmi';
import { ARC_GOV_CORE_ADDRESS, ARC_GOV_CORE_ABI } from '@/lib/contract';
import { CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useChainId } from 'wagmi';
import { useToast } from '@/components/shared/Toast';

interface VoteButtonsProps {
  proposalId: bigint;
  isOpen: boolean;
}

export function VoteButtons({ proposalId, isOpen }: VoteButtonsProps) {
  const { isConnected } = useAccount();
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const chainId = useChainId();
  const { toast } = useToast();

  const handleVote = (voteType: number) => {
    if (!isConnected) return;
    if (chainId !== 5042002) {
      toast("Please switch to Arc Testnet before voting", "error");
      return;
    }
    setSelectedVote(voteType);
    setShowConfirm(true);
  };

  const confirmVote = () => {
    if (selectedVote === null) return;
    if (chainId !== 5042002) {
      toast("Please switch to Arc Testnet before voting", "error");
      setShowConfirm(false);
      return;
    }
    writeContract({
      address: ARC_GOV_CORE_ADDRESS,
      abi: ARC_GOV_CORE_ABI,
      functionName: 'vote',
      args: [proposalId, selectedVote],
    });
    setShowConfirm(false);
  };

  if (!isOpen) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Voting is closed for this proposal</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="p-6 bg-[#E1F5EE] dark:bg-[#1D9E75]/10 border border-[#1D9E75] rounded-xl text-center space-y-3">
        <div className="flex justify-center text-[#1D9E75]">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="font-bold text-[#1D9E75]">Vote Cast Successfully!</h3>
        <p className="text-xs text-[#0F6E56]">Your vote has been recorded on the Arc blockchain.</p>
        <a 
          href={`https://testnet.arcscan.app/tx/${hash}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#1D9E75] hover:underline"
        >
          View Transaction <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <button
          disabled={!isConnected || isPending || isConfirming}
          onClick={() => handleVote(1)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#1D9E75]/20 hover:border-[#1D9E75] hover:bg-[#E1F5EE] dark:hover:bg-[#1D9E75]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg font-bold text-[#1D9E75]">FOR</span>
        </button>
        <button
          disabled={!isConnected || isPending || isConfirming}
          onClick={() => handleVote(2)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-red-500/20 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg font-bold text-red-500">AGAINST</span>
        </button>
        <button
          disabled={!isConnected || isPending || isConfirming}
          onClick={() => handleVote(0)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg font-bold text-gray-500 dark:text-gray-400">ABSTAIN</span>
        </button>
      </div>

      {(isPending || isConfirming) && (
        <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm font-medium">
          <Loader2 className="animate-spin text-[#1D9E75]" size={18} />
          {isPending ? 'Confirm in wallet...' : 'Waiting for blockchain...'}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-xs font-medium">
          <AlertCircle size={18} />
          {error.message.includes('Already voted') ? 'You have already voted on this proposal.' : 'Transaction failed. Please try again.'}
        </div>
      )}

      {!isConnected && (
        <p className="text-center text-xs text-gray-500 italic">Please connect your wallet to vote.</p>
      )}

      {/* Confirmation Modal Placeholder Logic */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0F1117] w-full max-w-md p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl scale-in-center">
            <h3 className="text-2xl font-bold mb-4">Confirm Your Vote</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              You are about to vote <span className="font-bold text-[#1D9E75]">
                {selectedVote === 1 ? 'FOR' : selectedVote === 2 ? 'AGAINST' : 'ABSTAIN'}
              </span> on proposal #{proposalId.toString()}. This action is permanent and will be recorded on the Arc blockchain.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-800 font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmVote}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1D9E75] text-white font-bold hover:bg-[#0F6E56] transition-all"
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
