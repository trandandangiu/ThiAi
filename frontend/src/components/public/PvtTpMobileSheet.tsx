import React from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

interface CardItem {
    id: string;
    name: string;
    roomCode?: string;
    total: number;
    overdue: number;
    completed: number;
}

interface PvtTpMobileSheetProps {
    open: boolean;
    type: 'PVT' | 'TP' | null;
    cards: CardItem[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onClose: () => void;
    canClick?: (card: CardItem) => boolean;
    title: string;
}

const cleanName = (name: string): string =>
    name
        .replace(/^Đồng chí\s+/i, '')
        .replace(/^Đ\/c\s+/i, '')
        .trim();

export const PvtTpMobileSheet: React.FC<PvtTpMobileSheetProps> = ({
    open,
    type,
    cards,
    selectedId,
    onSelect,
    onClose,
    canClick,
    title,
}) => {
    if (!open || !type) return null;

    const isPvt = type === 'PVT';
    const accent = isPvt
        ? { bg: 'bg-amber-50', text: 'text-amber-900', check: 'text-amber-600', badge: 'bg-amber-100 text-amber-800' }
        : { bg: 'bg-emerald-50', text: 'text-emerald-900', check: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-800' };

    const handleClick = (card: CardItem) => {
        const clickable = canClick ? canClick(card) : true;
        if (!clickable) return;
        if (selectedId === card.id) {
            onSelect(null);
        } else {
            onSelect(card.id);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-h-[75vh] bg-white rounded-t-2xl shadow-2xl flex flex-col animate-[slideUp_0.25s_ease]">
                {/* Handle bar */}
                <div className="flex justify-center pt-2 pb-1">
                    <div className="w-10 h-1 rounded-full bg-slate-300" />
                </div>

                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${accent.badge}`}>
                            {cards.length}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Clear filter button */}
                {selectedId && (
                    <button
                        type="button"
                        onClick={() => {
                            onSelect(null);
                            onClose();
                        }}
                        className="mx-4 mt-2 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                    >
                        Bỏ chọn bộ lọc
                    </button>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto overscroll-contain py-2">
                    {cards.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-slate-400 italic">
                            Chưa có dữ liệu
                        </div>
                    ) : (
                        cards.map(card => {
                            const isSelected = selectedId === card.id;
                            const clickable = canClick ? canClick(card) : true;
                            const displayName = cleanName(card.name);

                            return (
                                <button
                                    key={card.id}
                                    type="button"
                                    onClick={() => handleClick(card)}
                                    disabled={!clickable}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition cursor-pointer active:bg-slate-100 ${isSelected ? accent.bg : ''
                                        } ${!clickable ? 'opacity-40' : ''}`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className={`text-sm font-semibold truncate ${isSelected ? accent.text : 'text-slate-800'
                                                    }`}
                                            >
                                                {displayName}
                                            </span>
                                            {card.roomCode && (
                                                <span className="text-sm font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {card.roomCode}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {card.total} công văn
                                            {card.completed > 0 && (
                                                <span className="text-emerald-600"> · {card.completed} hoàn thành</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {card.overdue > 0 && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                                                <AlertTriangle className="w-3 h-3" />
                                                {card.overdue}
                                            </span>
                                        )}
                                        {isSelected && (
                                            <Check className={`w-5 h-5 ${accent.check}`} strokeWidth={2.5} />
                                        )}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Safe area bottom */}
                <div className="h-[env(safe-area-inset-bottom)] shrink-0" />
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};