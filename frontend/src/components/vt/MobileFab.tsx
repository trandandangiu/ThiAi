// src/components/vt/MobileFab.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Plus, FileText, Layers, Download, X } from 'lucide-react';

interface MobileFabProps {
  onCreateCongVan: () => void;
  onCreateChuyenDe: () => void;
  onExport: () => void;
}

export const MobileFab: React.FC<MobileFabProps> = ({
  onCreateCongVan,
  onCreateChuyenDe,
  onExport,
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ⭐ Đóng menu khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ⭐ ESC để đóng
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // ⭐ Khóa scroll body khi menu mở (tuỳ chọn)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    // Không khóa — vì menu nhỏ, không cần thiết
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div
      ref={wrapRef}
      className="lg:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* ═══ MENU ITEMS ═══ */}
      {open && (
        <>
          <button
            type="button"
            onClick={() => {
              onExport();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 text-xs font-bold cursor-pointer active:scale-95 transition"
            style={{ animation: 'fadeInUp 0.15s ease' }}
          >
            <Download className="w-3.5 h-3.5" />
            Xuất Excel
          </button>

          <button
            type="button"
            onClick={() => {
              onCreateChuyenDe();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-full shadow-lg text-xs font-bold cursor-pointer active:scale-95 transition"
            style={{ animation: 'fadeInUp 0.18s ease' }}
          >
            <Layers className="w-3.5 h-3.5" />
            Tạo chuyên đề
          </button>

          <button
            type="button"
            onClick={() => {
              onCreateCongVan();
              setOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-2 text-white rounded-full shadow-lg text-xs font-bold cursor-pointer active:scale-95 transition"
            style={{
              backgroundColor: '#B71C1C',
              animation: 'fadeInUp 0.2s ease',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            Tạo công văn
          </button>
        </>
      )}

      {/* ═══ NÚT FAB CHÍNH ═══ */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full text-white shadow-2xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-200"
        style={{
          backgroundColor: open ? '#475569' : '#B71C1C',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        }}
        aria-label={open ? 'Đóng menu tạo mới' : 'Mở menu tạo mới'}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* ═══ ANIMATION ═══ */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MobileFab;