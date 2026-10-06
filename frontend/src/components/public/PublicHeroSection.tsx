// src/components/public/PublicHeroSection.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  ArrowDown,
  X,
  ChevronDown,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { PvtTpMobileSheet } from './PvtTpMobileSheet';

interface PvtCard {
  id: string;
  name: string;
  roomCode?: string;
  total: number;
  overdue: number;
  completed: number;
}

interface TpCard {
  id: string;
  name: string;
  roomCode?: string;
  total: number;
  overdue: number;
  completed: number;
}

interface PublicHeroSectionProps {
  totalDispatches: number;
  totalCompleted: number;
  totalOverdue: number;
  onScrollToTable: () => void;
  pvtCards?: PvtCard[];
  tpCards?: TpCard[];
  selectedPvtId?: string | null;
  selectedTpId?: string | null;
  onSelectPvt?: (pvtId: string | null) => void;
  onSelectTp?: (tpId: string | null) => void;
  canClickPvtCard?: (card: PvtCard) => boolean;
  canClickTpCard?: (card: TpCard) => boolean;
  onFilterOverdue?: () => void;
  isOverdueFilterActive?: boolean;
  showPvtCards?: boolean;
  currentUserName?: string;
}

const getTodayString = (): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const today = new Date();
  return `${days[today.getDay()]}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
};

const getCurrentTime = (): string => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
};

const cleanName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/^Đồng chí\s+/i, '')
    .replace(/^Đ\/c\s+/i, '')
    .trim();
};

export const PublicHeroSection: React.FC<PublicHeroSectionProps> = ({
  onScrollToTable,
  pvtCards = [],
  tpCards = [],
  selectedPvtId = null,
  selectedTpId = null,
  onSelectPvt,
  onSelectTp,
  canClickPvtCard,
  canClickTpCard,
  onFilterOverdue,
  isOverdueFilterActive = false,
  totalDispatches = 0,
  totalCompleted = 0,
  totalOverdue = 0,
  showPvtCards = false,
  currentUserName = '',
}) => {
  const [timeStr, setTimeStr] = useState(getCurrentTime());
  const [openPanel, setOpenPanel] = useState<'PVT' | 'TP' | null>(null);
  const [mobileSheet, setMobileSheet] = useState<'PVT' | 'TP' | null>(null);

  const isMobile = useIsMobile(640);

  const pvtWrapRef = useRef<HTMLDivElement>(null);
  const tpWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTimeStr(getCurrentTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside để đóng dropdown desktop
  useEffect(() => {
    if (!openPanel) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const inPvt = pvtWrapRef.current?.contains(target);
      const inTp = tpWrapRef.current?.contains(target);
      if (!inPvt && !inTp) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPanel]);

  // Đóng dropdown desktop khi chuyển sang mobile
  useEffect(() => {
    if (isMobile) setOpenPanel(null);
  }, [isMobile]);

  const handlePvtClick = (pvtId: string) => {
    if (!onSelectPvt) return;
    if (selectedPvtId === pvtId) {
      onSelectPvt(null);
    } else {
      onSelectPvt(pvtId);
    }
  };

  const handleTpClick = (tpId: string) => {
    if (!onSelectTp) return;
    if (selectedTpId === tpId) {
      onSelectTp(null);
    } else {
      onSelectTp(tpId);
    }
  };

  const togglePvt = () => {
    setOpenPanel(prev => (prev === 'PVT' ? null : 'PVT'));
  };
  const toggleTp = () => {
    setOpenPanel(prev => (prev === 'TP' ? null : 'TP'));
  };

  return (
    <div
      className="relative rounded-lg sm:rounded-2xl text-white shadow-lg"
      style={{
        backgroundImage:
          'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 50%, #4A0808 100%)',
      }}
    >
      {/* Pattern + blob decorations */}
      <div className="absolute inset-0 rounded-lg sm:rounded-2xl overflow-hidden pointer-events-none">
        <div className="hidden sm:block absolute inset-0 opacity-10">
          <svg width="100%" height="100%">
            <defs>
              <pattern
                id="dots-hero"
                x="0"
                y="0"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="3" cy="3" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots-hero)" />
          </svg>
        </div>
        <div className="hidden sm:block absolute w-72 h-72 rounded-full bg-amber-500/20 blur-3xl -top-20 -right-20" />
        <div className="hidden sm:block absolute w-64 h-64 rounded-full bg-rose-500/20 blur-3xl -bottom-24 -left-20" />
      </div>

      {/* Content */}
      <div className="relative p-3 sm:p-4 lg:p-5">
        {/* ═══ HÀNG TRÊN ═══ */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          {/* Cột trái */}
          <div className="flex-1 min-w-0 space-y-2">
            <h1 className="hidden sm:block text-2xl lg:text-3xl font-black tracking-tight leading-tight">
              THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
            </h1>
            <h1 className="sm:hidden text-base font-black tracking-tight leading-tight">
              THEO DÕI TIẾN ĐỘ XỬ LÝ CÔNG VĂN
            </h1>

            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-red-100 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-medium">{getTodayString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-mono font-bold text-white">{timeStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <button
                type="button"
                onClick={onScrollToTable}
                className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white text-red-900 font-black text-[10px] sm:text-xs rounded-lg shadow-md hover:bg-amber-100 transition cursor-pointer active:scale-95"
              >
                <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Chi tiết tiến độ</span>
                <span className="sm:hidden">Xem bảng</span>
                <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-bounce" />
              </button>

              {totalOverdue > 0 && (
                <button
                  type="button"
                  onClick={onFilterOverdue}
                  className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold flex items-center gap-1 cursor-pointer transition border ${isOverdueFilterActive
                      ? 'bg-rose-500 border-rose-300 text-white shadow-md ring-2 ring-rose-300/50'
                      : 'bg-rose-500/25 hover:bg-rose-500/40 border-rose-400/40 text-rose-100'
                    }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{totalOverdue} quá hạn</span>
                  {isOverdueFilterActive && <X className="w-3 h-3 ml-0.5" />}
                </button>
              )}
            </div>
          </div>

          {/* ═══ CỘT PHẢI ═══ */}
          {showPvtCards && (
            <>
              {/* ═══════ DESKTOP / TABLET: 2 dropdown như cũ ═══════ */}
              {!isMobile && (
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* NÚT LÃNH ĐẠO */}
                  <div className="relative" ref={pvtWrapRef}>
                    <button
                      type="button"
                      onClick={togglePvt}
                      className={`inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${openPanel === 'PVT' || !!selectedPvtId
                          ? 'bg-amber-400 text-red-950 border-amber-300 shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
                        }`}
                      title="Xem danh sách Lãnh đạo Viện phụ trách"
                    >
                      <span className="hidden sm:inline">
                        Lãnh đạo Viện phụ trách
                      </span>
                      <span className="sm:hidden">Lãnh đạo</span>
                      {pvtCards.length > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${openPanel === 'PVT' || !!selectedPvtId
                              ? 'bg-red-900 text-amber-100'
                              : 'bg-white/20 text-white'
                            }`}
                        >
                          {pvtCards.length}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition ${openPanel === 'PVT' ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {openPanel === 'PVT' && (
                      <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] overflow-hidden">
                        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Lãnh đạo Viện phụ trách
                            </span>
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                              {pvtCards.length}
                            </span>
                          </div>
                          {selectedPvtId && (
                            <button
                              type="button"
                              onClick={() => onSelectPvt?.(null)}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Bỏ chọn
                            </button>
                          )}
                        </div>

                        <div className="hero-dropdown-scroll max-h-[340px] overflow-y-auto py-1">
                          {pvtCards.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-400 italic">
                              Chưa có Lãnh đạo Viện nào
                            </div>
                          ) : (
                            pvtCards.map(pvt => {
                              const isSelected = selectedPvtId === pvt.id;
                              const displayName = cleanName(pvt.name);
                              const clickable = canClickPvtCard
                                ? canClickPvtCard(pvt)
                                : true;
                              const hasOverdue = pvt.overdue > 0;

                              return (
                                <button
                                  key={pvt.id}
                                  type="button"
                                  onClick={() => {
                                    if (!clickable) return;
                                    handlePvtClick(pvt.id);
                                  }}
                                  disabled={!clickable}
                                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition cursor-pointer ${isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'
                                    } ${!clickable ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-[13px] font-semibold truncate ${isSelected
                                            ? 'text-amber-900'
                                            : 'text-slate-800'
                                          }`}
                                      >
                                        {displayName}
                                      </span>
                                      {pvt.roomCode && (
                                        <span className="text-[10px] font-mono font-medium text-slate-400 shrink-0">
                                          {pvt.roomCode}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {pvt.total} công văn
                                      {pvt.completed > 0 && (
                                        <span className="text-emerald-600">
                                          {' · '}
                                          {pvt.completed} hoàn thành
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {hasOverdue && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                                        <AlertTriangle className="w-3 h-3" />
                                        {pvt.overdue}
                                      </span>
                                    )}
                                    {isSelected && (
                                      <Check
                                        className="w-4 h-4 text-amber-600"
                                        strokeWidth={2.5}
                                      />
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* NÚT TRƯỞNG PHÒNG */}
                  <div className="relative" ref={tpWrapRef}>
                    <button
                      type="button"
                      onClick={toggleTp}
                      className={`inline-flex items-center gap-2 h-9 px-3.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${openPanel === 'TP' || !!selectedTpId
                          ? 'bg-amber-400 text-red-950 border-amber-300 shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
                        }`}
                      title="Xem danh sách Trưởng phòng"
                    >
                      <span className="hidden sm:inline">Trưởng phòng</span>
                      <span className="sm:hidden">Trưởng phòng</span>
                      {tpCards.length > 0 && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${openPanel === 'TP' || !!selectedTpId
                              ? 'bg-red-900 text-amber-100'
                              : 'bg-white/20 text-white'
                            }`}
                        >
                          {tpCards.length}
                        </span>
                      )}
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition ${openPanel === 'TP' ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {openPanel === 'TP' && (
                      <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] overflow-hidden">
                        <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Trưởng phòng
                            </span>
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                              {tpCards.length}
                            </span>
                          </div>
                          {selectedTpId && (
                            <button
                              type="button"
                              onClick={() => onSelectTp?.(null)}
                              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                            >
                              Bỏ chọn
                            </button>
                          )}
                        </div>

                        <div className="hero-dropdown-scroll max-h-[340px] overflow-y-auto py-1">
                          {tpCards.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-400 italic">
                              Chưa có Trưởng phòng nào
                            </div>
                          ) : (
                            tpCards.map(tp => {
                              const isSelected = selectedTpId === tp.id;
                              const displayName = cleanName(tp.name);
                              const clickable = canClickTpCard
                                ? canClickTpCard(tp)
                                : true;
                              const hasOverdue = tp.overdue > 0;

                              return (
                                <button
                                  key={tp.id}
                                  type="button"
                                  onClick={() => {
                                    if (!clickable) return;
                                    handleTpClick(tp.id);
                                  }}
                                  disabled={!clickable}
                                  className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition cursor-pointer ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                    } ${!clickable ? 'opacity-40 cursor-not-allowed' : ''}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-[13px] font-semibold truncate ${isSelected
                                            ? 'text-emerald-900'
                                            : 'text-slate-800'
                                          }`}
                                      >
                                        {displayName}
                                      </span>
                                      {tp.roomCode && (
                                        <span className="text-xs font-mono font-bold text-slate-700 shrink-0">
                                          {tp.roomCode}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                      {tp.total} công văn
                                      {tp.completed > 0 && (
                                        <span className="text-emerald-600">
                                          {' · '}
                                          {tp.completed} hoàn thành
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {hasOverdue && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                                        <AlertTriangle className="w-3 h-3" />
                                        {tp.overdue}
                                      </span>
                                    )}
                                    {isSelected && (
                                      <Check
                                        className="w-4 h-4 text-emerald-600"
                                        strokeWidth={2.5}
                                      />
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════ MOBILE: 2 nút gọn full width ═══════ */}
              {isMobile && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setMobileSheet('PVT')}
                    className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer active:scale-[0.98] ${selectedPvtId
                        ? 'bg-amber-400 text-red-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-white border-white/25'
                      }`}
                  >
                    <span className="truncate">Lãnh đạo</span>
                    {pvtCards.length > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${selectedPvtId
                            ? 'bg-red-900 text-amber-100'
                            : 'bg-white/20 text-white'
                          }`}
                      >
                        {pvtCards.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileSheet('TP')}
                    className={`inline-flex items-center justify-center gap-1.5 h-10 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer active:scale-[0.98] ${selectedTpId
                        ? 'bg-amber-400 text-red-950 border-amber-300 shadow-sm'
                        : 'bg-white/10 text-white border-white/25'
                      }`}
                  >
                    <span className="truncate">Trưởng phòng</span>
                    {tpCards.length > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${selectedTpId
                            ? 'bg-red-900 text-amber-100'
                            : 'bg-white/20 text-white'
                          }`}
                      >
                        {tpCards.length}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM SHEETS ═══ */}
      <PvtTpMobileSheet
        open={mobileSheet === 'PVT'}
        type="PVT"
        cards={pvtCards}
        selectedId={selectedPvtId}
        onSelect={id => onSelectPvt?.(id)}
        onClose={() => setMobileSheet(null)}
        canClick={canClickPvtCard}
        title="Lãnh đạo Viện phụ trách"
      />

      <PvtTpMobileSheet
        open={mobileSheet === 'TP'}
        type="TP"
        cards={tpCards}
        selectedId={selectedTpId}
        onSelect={id => onSelectTp?.(id)}
        onClose={() => setMobileSheet(null)}
        canClick={canClickTpCard}
        title="Trưởng phòng "
      />
    </div>
  );
};

export default PublicHeroSection;