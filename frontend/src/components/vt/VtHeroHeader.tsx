// src/components/vt/VtHeroHeader.tsx
import React from 'react';
import { Crown, Sparkles, Calendar, Clock } from 'lucide-react';
import { VtSummary } from '../../types/vt';

interface VtHeroHeaderProps {
  userName: string;
  summary: VtSummary;
  onRefresh: () => void;
  isLoading: boolean;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Chào buổi sáng';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
};

const getTodayString = (): string => {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const today = new Date();
  return `${days[today.getDay()]}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
};

const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const VtHeroHeader: React.FC<VtHeroHeaderProps> = ({
  userName,
  summary,
  onRefresh,
  isLoading,
}) => {
  const urgentCount = summary.quaHan + summary.sapDenHan;
  const todayStr = getTodayString();
  const timeStr = getCurrentTime();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-900 via-red-800 to-amber-900 text-white shadow-2xl border border-red-950/40">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dots-vt" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-vt)" />
        </svg>
      </div>

      {/* Glow blobs */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-red-500/20 blur-3xl pointer-events-none" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left — Greeting */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-amber-100">
                  Viện trưởng
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              {getGreeting()}, <span className="text-amber-300">{userName}</span>
            </h1>

            <div className="flex items-center gap-4 mt-3 text-xs text-red-100 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-medium">{todayStr}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-mono font-medium">{timeStr}</span>
              </div>
            </div>

            {/* Alert row */}
            {urgentCount > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-400/40">
                <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                <span className="text-xs font-bold text-amber-50">
                  Hôm nay bạn có <span className="text-amber-200 font-black">{urgentCount}</span> việc cần xử lý
                  {summary.quaHan > 0 && (
                    <span className="ml-1 text-rose-200">
                      (trong đó {summary.quaHan} quá hạn)
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Right — Quick stats grid */}
          <div className="flex flex-col gap-3 shrink-0">
            <div className="grid grid-cols-3 gap-2.5">
              <QuickStat label="Tổng CV" value={summary.total} tone="white" />
              <QuickStat label="Hoàn thành" value={summary.hoanThanh} tone="emerald" />
              <QuickStat label="Quá hạn" value={summary.quaHan} tone="rose" alert={summary.quaHan > 0} />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <QuickStat label="Chờ phân PVT" value={summary.chuaPhanCongPvt} tone="white" alert={summary.chuaPhanCongPvt > 0} />
              <QuickStat label="Sắp đến hạn" value={summary.sapDenHan} tone="white" alert={summary.sapDenHan > 0} />
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Làm mới dữ liệu"
              >
                <svg
                  className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// QUICK STAT
// ============================================
interface QuickStatProps {
  label: string;
  value: number;
  tone: 'white' | 'emerald' | 'rose';
  alert?: boolean;
}

const QuickStat: React.FC<QuickStatProps> = ({ label, value, tone, alert }) => {
  const toneClasses = {
    white: 'bg-white/10 border-white/20 text-white',
    emerald: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100',
    rose: 'bg-rose-500/20 border-rose-400/40 text-rose-100',
  }[tone];

  return (
    <div className={`px-3 py-2.5 rounded-xl backdrop-blur-sm border ${toneClasses} relative`}>
      {alert && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
      )}
      <div className="text-[10px] uppercase tracking-wider font-bold opacity-90">{label}</div>
      <div className="text-xl font-black mt-0.5 leading-none">{value}</div>
    </div>
  );
};

export default VtHeroHeader;