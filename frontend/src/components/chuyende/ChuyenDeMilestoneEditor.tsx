// src/components/chuyende/ChuyenDeMilestoneEditor.tsx
import React from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { ChuyenDeMilestone } from '../../utils/chuyenDe';

export interface MilestoneDraft {
  id: string;
  ten: string;
  han: string;
}

interface Props {
  milestones: MilestoneDraft[];
  onChange: (milestones: MilestoneDraft[]) => void;
  disabled?: boolean;
}

export const ChuyenDeMilestoneEditor: React.FC<Props> = ({
  milestones,
  onChange,
  disabled = false,
}) => {
  const addMilestone = () => {
    const idx = milestones.length + 1;
    onChange([
      ...milestones,
      {
        id: `m_${Date.now()}_${idx}`,
        ten: '',
        han: '',
      },
    ]);
  };

  const removeMilestone = (id: string) => {
    onChange(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (
    id: string,
    field: 'ten' | 'han',
    value: string
  ) => {
    onChange(
      milestones.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
          ⏱ Mốc thời hạn

        </div>
      </div>

      {/* Milestone list */}
      {milestones.length === 0 && (
        <div className="text-center py-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
          <p className="text-[11px] text-slate-500 italic">
            Chưa có mốc nào — bấm nút bên dưới để thêm
          </p>
        </div>
      )}

      {milestones.map((m, idx) => {
        const isFirst = idx === 0;

        return (
          <div
            key={m.id}
            className={`relative p-3 rounded-lg border-2 transition ${
              isFirst
                ? 'border-blue-300 bg-blue-50/40'
                : 'border-slate-200 bg-white'
            }`}
          >
            {/* Badge thứ tự + nút xoá */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                    isFirst
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isFirst ? 'Mốc đầu tiên' : `Mốc ${idx + 1}`}
                </span>
              </div>

              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(m.id)}
                  disabled={disabled}
                  className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer disabled:opacity-50"
                  title="Xoá mốc này"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <div className="sm:col-span-3">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Tên mốc
                </label>
                <input
                  type="text"
                  value={m.ten}
                  onChange={e => updateMilestone(m.id, 'ten', e.target.value)}
                  placeholder=""
                  disabled={disabled}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                  Hạn hoàn thành
                </label>
                <input
                  type="date"
                  value={m.han}
                  onChange={e => updateMilestone(m.id, 'han', e.target.value)}
                  disabled={disabled}
                  className="w-full h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 disabled:bg-slate-50"
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* Add button */}
      <button
        type="button"
        onClick={addMilestone}
        disabled={disabled}
        className="w-full py-2.5 border-2 border-dashed border-teal-300 hover:border-teal-500 hover:bg-teal-50/30 rounded-lg text-teal-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        Thêm mốc thời hạn
      </button>
    </div>
  );
};

export default ChuyenDeMilestoneEditor;