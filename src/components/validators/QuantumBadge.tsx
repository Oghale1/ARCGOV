// ArcGov — arcgov.vercel.app
import React from 'react';

interface QuantumBadgeProps {
  status: 'ready' | 'in-progress' | 'pending';
}

export default function QuantumBadge({ status }: QuantumBadgeProps) {
  const config = {
    ready: {
      bg: 'bg-[#E1F5EE]',
      text: 'text-[#0F6E56]',
      label: 'PQ Ready'
    },
    'in-progress': {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      label: 'Upgrading'
    },
    pending: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      label: 'Pending'
    }
  };

  const current = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-[2px] rounded-[4px] text-[10px] font-bold uppercase tracking-wider ${current.bg} ${current.text}`}>
      {current.label}
    </span>
  );
}
