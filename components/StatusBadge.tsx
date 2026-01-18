import React from 'react';
import { PaperStatus } from '../types';
import { STATUS_COLORS } from '../constants';

interface Props {
  status: PaperStatus;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  
  // Format status text: UNDER_REVIEW -> Under Review
  const text = status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());

  return (
    <span className={`inline-flex items-center justify-center font-medium rounded-full border ${colorClass} ${sizeClass}`}>
      {text}
    </span>
  );
};

export default StatusBadge;