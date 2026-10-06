// src/components/ui/AgencyCombobox.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Building2, Plus, X, Check, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'vks_agency_presets';

// Đơn vị mặc định lần đầu — người dùng có thể xoá/thêm
const DEFAULT_AGENCIES = [
  'UBND Tỉnh',
  'UBND Thành phố',
  'Bộ Tư pháp',
  'Bộ Công an',
  'VKSND Tối cao',
  'TAND Tối cao',
  'Văn phòng Chính phủ',
  'Sở Tư pháp',
  'Sở Xây dựng',
  'Cục Thi hành án dân sự',
];

interface AgencyComboboxProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const AgencyCombobox: React.FC<AgencyComboboxProps> = ({
  value,
  onChange,
  placeholder = 'Chọn hoặc nhập đơn vị ban hành...',
  required,
  className,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [presets, setPresets] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ═══ Load presets từ localStorage ═══
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPresets(parsed);
          return;
        }
      }
    } catch {
      // ignore
    }
    setPresets(DEFAULT_AGENCIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_AGENCIES));
  }, []);

  // ═══ Lưu presets ═══
  const savePresets = (list: string[]) => {
    setPresets(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  // ═══ Click ngoài → đóng dropdown ═══
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [isOpen]);

  // ═══ Lọc danh sách theo text nhập ═══
  const filtered = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return presets;
    return presets.filter(p => p.toLowerCase().includes(q));
  }, [presets, value]);

  // ═══ Check đơn vị đã có trong preset chưa ═══
  const existsExact = useMemo(() => {
    const v = (value || '').trim();
    if (!v) return false;
    return presets.some(p => p.toLowerCase() === v.toLowerCase());
  }, [presets, value]);

  const canAdd = (value || '').trim().length >= 2 && !existsExact;

  // ═══ Handlers ═══
  const handleSelect = (agency: string) => {
    onChange(agency);
    setIsOpen(false);
  };

  const handleAddPreset = () => {
    const v = (value || '').trim();
    if (!v || existsExact) return;
    const next = [...presets, v].sort((a, b) =>
      a.localeCompare(b, 'vi', { sensitivity: 'base' })
    );
    savePresets(next);
  };

  const handleRemovePreset = (agency: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Xoá "${agency}" khỏi danh sách thường dùng?`)) return;
    const next = presets.filter(p => p !== agency);
    savePresets(next);
    if (value === agency) onChange('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      {/* Input chính */}
      <div className="relative">
        <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={
            className ||
            'w-full h-8 pl-8 pr-14 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-slate-50'
          }
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              title="Xoá"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-50"
            title="Xem danh sách"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-72 flex flex-col">
          {canAdd && (
            <button
              type="button"
              onClick={handleAddPreset}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-b border-emerald-200 transition cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="truncate">
                Lưu "<span className="text-emerald-900">{value.trim()}</span>" vào danh sách
              </span>
            </button>
          )}

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[11px] text-slate-400 italic">
                {value
                  ? `Không tìm thấy đơn vị nào khớp với "${value}"`
                  : 'Chưa có đơn vị nào trong danh sách'}
              </div>
            ) : (
              filtered.map(agency => {
                const isSelected =
                  (value || '').trim().toLowerCase() ===
                  agency.toLowerCase();
                return (
                  <div
                    key={agency}
                    onClick={() => handleSelect(agency)}
                    className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition ${
                      isSelected
                        ? 'bg-red-50 text-red-800'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="text-xs font-medium truncate">
                        {agency}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={e => handleRemovePreset(agency, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-rose-500 transition cursor-pointer shrink-0"
                      title="Xoá khỏi danh sách"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-500 flex items-center justify-between shrink-0">

          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyCombobox;