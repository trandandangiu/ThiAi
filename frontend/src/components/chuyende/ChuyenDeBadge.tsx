// src/components/chuyende/ChuyenDeBadge.tsx
import React from 'react';
import {
  isChuyenDe,
  getChuyenDePhase,
  getMilestoneProgress,
} from '../../utils/chuyenDe';
import { Dispatch } from '../../types/dispatch';

interface ChuyenDeBadgeProps {
  dispatch: Dispatch;
  variant?: 'full' | 'compact';
}

export const ChuyenDeBadge: React.FC<ChuyenDeBadgeProps> = ({
  dispatch,
  variant = 'full',
}) => {
  if (!isChuyenDe(dispatch)) return null;

  const phase = getChuyenDePhase(dispatch);
  const progress = getMilestoneProgress(dispatch);

  if (variant === 'compact') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-300">
        CD {progress.done}/{progress.total}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Tag CHUYÊN ĐỀ */}
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-teal-100 text-teal-800 border border-teal-300 uppercase">
        Chuyên đề
      </span>

      {/* Progress mốc */}
      {progress.total > 0 && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {progress.done}/{progress.total} mốc
        </span>
      )}

      {/* Phase badge */}
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${phase.bgClass} ${phase.textClass} ${phase.borderClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${phase.dotColor}`} />
        {phase.label}
      </span>
    </div>
  );
};

export default ChuyenDeBadge;