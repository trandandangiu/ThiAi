// src/components/pvt/PvtHeroHeader.tsx
import React from 'react';
import { User, Shield, Calendar, Clock, TrendingUp, RefreshCw } from 'lucide-react';

interface PvtHeroHeaderProps {
    userName: string;
    roomCode?: string;
    summary: {
        total: number;
        hoanThanh: number;
        quaHan: number;
        choTrinhVt?: number;
        choGiaoTp?: number;
    };
    onRefresh?: () => void;
    isLoading?: boolean;
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

export const PvtHeroHeader: React.FC<PvtHeroHeaderProps> = ({
    userName,
    roomCode,
    summary,
    onRefresh,
    isLoading,
}) => {


    return (
        <div
            className="relative overflow-hidden rounded-3xl text-white shadow-xl"
            style={{
                backgroundImage: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 100%)',
            }}
        >
            {/* Pattern dots */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id="dots-pvt-hero" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots-pvt-hero)" />
                </svg>
            </div>

            <div className="relative p-6 sm:p-7">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left — Greeting */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className="px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/25 text-[10px] font-black tracking-widest uppercase text-amber-100 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Phó Viện trưởng
                            </span>
                            {roomCode && (
                                <span className="px-2.5 py-1 bg-amber-400/25 backdrop-blur-sm rounded-full border border-amber-300/40 text-[10px] font-black text-amber-100 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {roomCode}
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            {getGreeting()},{' '}
                            <span style={{ color: '#FFD700' }}>{userName}</span>
                        </h1>

                        <div className="flex items-center gap-4 mt-2 text-xs text-red-100 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                                <span className="font-medium">{getTodayString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-300" />
                                <span className="font-mono font-medium">{getCurrentTime()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right — KPI badges */}
                    <div className="flex flex-col gap-2.5 shrink-0">
                        <div className="grid grid-cols-3 gap-2.5">
                            <KpiBadge
                                label="Tổng CV"
                                value={summary.total}
                                color="bg-white/10 border-white/20"
                            />
                            <KpiBadge
                                label="Hoàn thành"
                                value={summary.hoanThanh}
                                color="bg-emerald-500/25 border-emerald-400/40"
                            />
                            <KpiBadge
                                label="Quá hạn"
                                value={summary.quaHan}
                                color="bg-rose-500/25 border-rose-400/40"
                                alert={summary.quaHan > 0}
                            />
                        </div>

                        {/* Completion rate */}
                        {/* Extra stats + Refresh */}
                        <div className="grid grid-cols-3 gap-2.5">
                            <KpiBadge
                                label="Chờ giao TP"
                                value={summary.choGiaoTp || 0}
                                color="bg-amber-500/25 border-amber-400/40"
                                alert={(summary.choGiaoTp || 0) > 0}
                            />
                            <KpiBadge
                                label="Chờ trình VT"
                                value={summary.choTrinhVt || 0}
                                color="bg-purple-500/25 border-purple-400/40"
                                alert={(summary.choTrinhVt || 0) > 0}
                            />
                            {onRefresh && (
                                <button
                                    onClick={onRefresh}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 transition cursor-pointer active:scale-95 disabled:opacity-50"
                                    title="Làm mới"
                                >
                                    <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
                                    <span className="text-[10px] font-bold text-white">Làm mới</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================
// KPI BADGE
// ============================================
const KpiBadge: React.FC<{
    label: string;
    value: number;
    color: string;
    alert?: boolean;
}> = ({ label, value, color, alert }) => (
    <div className={`px-3 py-2 rounded-xl backdrop-blur-sm border ${color} relative`}>
        {alert && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
        )}
        <div className="text-[9px] uppercase tracking-wider font-bold text-white/90">
            {label}
        </div>
        <div className="text-lg font-black mt-0.5 leading-none">{value}</div>
    </div>
);

export default PvtHeroHeader;