// src/components/vt/VtFilterBar.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Check,
  Search,
  X,
  ArrowUpDown,
  FileText,
  Building2,
  UserCheck,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { User } from '../../types/auth';
import { VtFilters, DEFAULT_VT_FILTERS } from '../../types/vt';
import { Dispatch } from '../../types/dispatch';
import { isChuyenDe } from '../../utils/chuyenDe';
import { resolveDispatchStatus } from '../../services/excelService';

interface VtFilterBarProps {
  filters: VtFilters;
  onChange: (filters: VtFilters) => void;
  pvtList: User[];
  totalResults: number;
  chuyenDeCount?: number;
  dispatches: Dispatch[];
}

const LOAI_VAN_BAN_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'CONG_VAN', label: 'Công văn' },
  { value: 'CHUYEN_DE', label: 'Chuyên đề' },
];

const GENERAL_SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
];

// ⭐ Sort theo trạng thái tiến độ
const STATUS_SORT_OPTIONS = [

  { value: 'sort_status_overdue_first', label: 'Quá hạn ' },
  { value: 'sort_status_completed_last', label: 'Hoàn thành ' },
];

export const VtFilterBar: React.FC<VtFilterBarProps> = ({
  filters,
  onChange,
  pvtList,
  totalResults,
  chuyenDeCount = 0,
  dispatches = [],
}) => {
  const [showPvtDropdown, setShowPvtDropdown] = useState(false);
  const [showDatePanel, setShowDatePanel] = useState(false);
  const [showLoaiDropdown, setShowLoaiDropdown] = useState(false);
  const [showGeneralSortDropdown, setShowGeneralSortDropdown] = useState(false);
  const [showSortLoaiVBDropdown, setShowSortLoaiVBDropdown] = useState(false);
  const [showSortDonViDropdown, setShowSortDonViDropdown] = useState(false);
  const [showSortPvtDropdown, setShowSortPvtDropdown] = useState(false);
  const [showSortStatusDropdown, setShowSortStatusDropdown] = useState(false);

  const loaiDropdownRef = useRef<HTMLDivElement>(null);
  const pvtDropdownRef = useRef<HTMLDivElement>(null);
  const generalSortRef = useRef<HTMLDivElement>(null);
  const sortLoaiVBRef = useRef<HTMLDivElement>(null);
  const sortDonViRef = useRef<HTMLDivElement>(null);
  const sortPvtRef = useRef<HTMLDivElement>(null);
  const sortStatusRef = useRef<HTMLDivElement>(null);

  // ⭐ Extract danh sách động
  const dynamicOptions = useMemo(() => {
    const safeDispatches = Array.isArray(dispatches) ? dispatches : [];

    const loaiVbSet = new Set<string>();
    safeDispatches.forEach(d => {
      if (d.loaiCongVan && d.loaiCongVan.trim()) loaiVbSet.add(d.loaiCongVan.trim());
    });
    const loaiVanBanList = Array.from(loaiVbSet).sort((a, b) => a.localeCompare(b, 'vi'));

    const donViSet = new Set<string>();
    safeDispatches.forEach(d => {
      if (d.donViBanHanh && d.donViBanHanh.trim()) donViSet.add(d.donViBanHanh.trim());
    });
    const donViList = Array.from(donViSet).sort((a, b) => a.localeCompare(b, 'vi'));

    const pvtSet = new Map<string, { id: string; name: string; roomCode: string }>();
    safeDispatches.forEach(d => {
      if (d.assignedPvtId && d.assignedPvtName && !pvtSet.has(d.assignedPvtId)) {
        const pvt = pvtList.find(p => p.id === d.assignedPvtId);
        pvtSet.set(d.assignedPvtId, {
          id: d.assignedPvtId,
          name: d.assignedPvtName,
          roomCode: pvt?.roomCode || '',
        });
      }
    });
    const pvtListDynamic = Array.from(pvtSet.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'vi')
    );

    const statusCount = { QUA_HAN: 0, SAP_DEN_HAN: 0, DANG_XU_LY: 0, HOAN_THANH: 0 };
    safeDispatches.forEach(d => {
      const st = resolveDispatchStatus(d);
      if (st === 'QUA_HAN') statusCount.QUA_HAN++;
      else if (st === 'SAP_DEN_HAN') statusCount.SAP_DEN_HAN++;
      else if (st === 'HOAN_THANH') statusCount.HOAN_THANH++;
      else statusCount.DANG_XU_LY++;
    });

    return {
      loaiVanBan: loaiVanBanList,
      donVi: donViList,
      pvt: pvtListDynamic,
      statusCount,
    };
  }, [dispatches, pvtList]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const refs = [
        { ref: loaiDropdownRef, setter: setShowLoaiDropdown },
        { ref: pvtDropdownRef, setter: setShowPvtDropdown },
        { ref: generalSortRef, setter: setShowGeneralSortDropdown },
        { ref: sortLoaiVBRef, setter: setShowSortLoaiVBDropdown },
        { ref: sortDonViRef, setter: setShowSortDonViDropdown },
        { ref: sortPvtRef, setter: setShowSortPvtDropdown },
        { ref: sortStatusRef, setter: setShowSortStatusDropdown },
      ];
      refs.forEach(({ ref, setter }) => {
        if (ref.current && !ref.current.contains(target)) setter(false);
      });
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const update = (patch: Partial<VtFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const resetAll = () => onChange(DEFAULT_VT_FILTERS);

  // ⭐ Toggle sort: click cùng item → đảo chiều asc/desc
  const toggleFieldSort = (
    prefix: string,
    value: string,
    currentMode: string,
    closeDropdown: () => void
  ) => {
    const ascValue = `${prefix}_asc_${value}`;
    const descValue = `${prefix}_desc_${value}`;

    if (currentMode === ascValue) {
      // Đang asc → chuyển sang desc
      update({ sortMode: descValue as any });
    } else if (currentMode === descValue) {
      // Đang desc → bỏ sort (về newest)
      update({ sortMode: 'newest' });
    } else {
      // Chưa sort → bắt đầu bằng asc
      update({ sortMode: ascValue as any });
    }
    closeDropdown();
  };

  const currentLoaiOption =
    LOAI_VAN_BAN_FILTER_OPTIONS.find(o => o.value === filters.loaiVanBan) ||
    LOAI_VAN_BAN_FILTER_OPTIONS[0];

  const currentSortMode = filters.sortMode || 'newest';

  const isSortingByLoaiVB = currentSortMode.startsWith('sort_loai_vb_');
  const isSortingByDonVi = currentSortMode.startsWith('sort_don_vi_');
  const isSortingByPvt = currentSortMode.startsWith('sort_pvt_');
  const isSortingByStatus = currentSortMode.startsWith('sort_status');
  const isDesc = currentSortMode.includes('_desc_');

  const hasActiveFilter =
    filters.searchQuery !== '' ||
    filters.pvtIds.length > 0 ||
    filters.status !== 'ALL' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.loaiVanBan !== 'ALL' ||
    currentSortMode !== 'newest';

  const congVanCount = Math.max(0, totalResults - chuyenDeCount);

  const btnBase =
    'inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold rounded-lg border transition cursor-pointer whitespace-nowrap';

  // ⭐ Class chung cho dropdown container (giống hệt filter dropdown)
  const dropdownClass =
    'absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden py-1 max-h-80 overflow-y-auto';

  // ⭐ Class cho mỗi item trong dropdown
  const itemClass = (isActive: boolean, activeColor: string = 'blue') =>
    `w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
      ? `bg-${activeColor}-50 text-${activeColor}-900 font-bold`
      : 'hover:bg-slate-50 text-slate-700 font-medium'
    }`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">

        {/* ── Ô TÌM KIẾM ── */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm số CV, trích yếu, đơn vị..."
            value={filters.searchQuery}
            onChange={e => update({ searchQuery: e.target.value })}
            className="w-full h-9 pl-9 pr-9 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:bg-white transition"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => update({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ── FILTER LOẠI VĂN BẢN ── */}
        <div className="relative" ref={loaiDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLoaiDropdown(prev => !prev)}
            className={`${btnBase} ${filters.loaiVanBan !== 'ALL'
                ? 'bg-red-50 text-red-800 border-red-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
          >
            <span>{currentLoaiOption.label}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition ${showLoaiDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showLoaiDropdown && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              {LOAI_VAN_BAN_FILTER_OPTIONS.map(opt => {
                const isActive = filters.loaiVanBan === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      update({ loaiVanBan: opt.value as any });
                      setShowLoaiDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-red-50 text-red-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-red-600" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SORT CHUNG ── */}
        <div className="relative" ref={generalSortRef}>
          <button
            type="button"
            onClick={() => setShowGeneralSortDropdown(prev => !prev)}
            className={`${btnBase} ${!isSortingByLoaiVB && !isSortingByDonVi && !isSortingByPvt && !isSortingByStatus && currentSortMode !== 'newest'
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>
              {GENERAL_SORT_OPTIONS.find(o => o.value === currentSortMode)?.label || 'Mới nhất'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 transition ${showGeneralSortDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showGeneralSortDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              {GENERAL_SORT_OPTIONS.map(opt => {
                const isActive = currentSortMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      update({ sortMode: opt.value as any });
                      setShowGeneralSortDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-blue-50 text-blue-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ⭐ SORT THEO LOẠI VĂN BẢN — CLICK TOGGLE ASC/DESC */}
        <div className="relative" ref={sortLoaiVBRef}>
          <button
            type="button"
            onClick={() => setShowSortLoaiVBDropdown(prev => !prev)}
            disabled={dynamicOptions.loaiVanBan.length === 0}
            className={`${btnBase} ${isSortingByLoaiVB
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              } ${dynamicOptions.loaiVanBan.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Loại văn bản"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Loại văn bản</span>
            {isSortingByLoaiVB && (
              isDesc
                ? <ArrowDown className="w-3 h-3" />
                : <ArrowUp className="w-3 h-3" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition ${showSortLoaiVBDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortLoaiVBDropdown && dynamicOptions.loaiVanBan.length > 0 && (
            <div className={dropdownClass}>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white border-b border-slate-100 z-10">
                Loại văn bản
              </div>

              {dynamicOptions.loaiVanBan.map(loai => {
                const ascValue = `sort_loai_vb_asc_${loai}`;
                const descValue = `sort_loai_vb_desc_${loai}`;
                const isActive = currentSortMode === ascValue || currentSortMode === descValue;
                const itemIsDesc = currentSortMode === descValue;

                return (
                  <button
                    key={loai}
                    type="button"
                    onClick={() => toggleFieldSort('sort_loai_vb', loai, currentSortMode, () => setShowSortLoaiVBDropdown(false))}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-purple-50 text-purple-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <span className="flex-1 truncate" title={loai}>{loai}</span>
                    {isActive && (
                      itemIsDesc
                        ? <ArrowDown className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        : <ArrowUp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ⭐ SORT THEO ĐƠN VỊ */}
        <div className="relative" ref={sortDonViRef}>
          <button
            type="button"
            onClick={() => setShowSortDonViDropdown(prev => !prev)}
            disabled={dynamicOptions.donVi.length === 0}
            className={`${btnBase} ${isSortingByDonVi
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              } ${dynamicOptions.donVi.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Sắp xếp theo đơn vị ban hành"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Đơn vị</span>
            {isSortingByDonVi && (
              isDesc
                ? <ArrowDown className="w-3 h-3" />
                : <ArrowUp className="w-3 h-3" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition ${showSortDonViDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortDonViDropdown && dynamicOptions.donVi.length > 0 && (
            <div className={dropdownClass}>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white border-b border-slate-100 z-10">
                Đơn vị
              </div>

              {dynamicOptions.donVi.map(donVi => {
                const ascValue = `sort_don_vi_asc_${donVi}`;
                const descValue = `sort_don_vi_desc_${donVi}`;
                const isActive = currentSortMode === ascValue || currentSortMode === descValue;
                const itemIsDesc = currentSortMode === descValue;

                return (
                  <button
                    key={donVi}
                    type="button"
                    onClick={() => toggleFieldSort('sort_don_vi', donVi, currentSortMode, () => setShowSortDonViDropdown(false))}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <span className="flex-1 truncate" title={donVi}>{donVi}</span>
                    {isActive && (
                      itemIsDesc
                        ? <ArrowDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        : <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ⭐ SORT THEO PVT */}
        <div className="relative" ref={sortPvtRef}>
          <button
            type="button"
            onClick={() => setShowSortPvtDropdown(prev => !prev)}
            disabled={dynamicOptions.pvt.length === 0}
            className={`${btnBase} ${isSortingByPvt
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              } ${dynamicOptions.pvt.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Sắp xếp theo Phó viện trưởng"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Phó viện trưởng</span>
            {isSortingByPvt && (
              isDesc
                ? <ArrowDown className="w-3 h-3" />
                : <ArrowUp className="w-3 h-3" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition ${showSortPvtDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortPvtDropdown && dynamicOptions.pvt.length > 0 && (
            <div className={dropdownClass}>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 bg-white border-b border-slate-100 z-10">
                Phó viện trưởng
              </div>

              {dynamicOptions.pvt.map(pvt => {
                const ascValue = `sort_pvt_asc_${pvt.id}`;
                const descValue = `sort_pvt_desc_${pvt.id}`;
                const isActive = currentSortMode === ascValue || currentSortMode === descValue;
                const itemIsDesc = currentSortMode === descValue;

                return (
                  <button
                    key={pvt.id}
                    type="button"
                    onClick={() => toggleFieldSort('sort_pvt', pvt.id, currentSortMode, () => setShowSortPvtDropdown(false))}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-amber-50 text-amber-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      {pvt.roomCode && (
                        <span className="text-[10px] font-mono font-bold text-amber-700 shrink-0">
                          {pvt.roomCode}
                        </span>
                      )}
                      <span className="truncate" title={pvt.name}>{pvt.name}</span>
                    </div>
                    {isActive && (
                      itemIsDesc
                        ? <ArrowDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        : <ArrowUp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ⭐ SORT THEO TIẾN ĐỘ */}
        <div className="relative" ref={sortStatusRef}>
          <button
            type="button"
            onClick={() => setShowSortStatusDropdown(prev => !prev)}
            className={`${btnBase} ${isSortingByStatus
                ? 'bg-rose-50 text-rose-800 border-rose-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            title="Sắp xếp theo trạng thái tiến độ"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Tiến độ</span>
            {isSortingByStatus && (
              isDesc
                ? <ArrowDown className="w-3 h-3" />
                : <ArrowUp className="w-3 h-3" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition ${showSortStatusDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showSortStatusDropdown && (
            <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden py-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Trạng thái
              </div>

              {/* Thống kê trạng thái */}


              {STATUS_SORT_OPTIONS.map(opt => {
                const isActive = currentSortMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      update({ sortMode: opt.value as any });
                      setShowSortStatusDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${isActive
                        ? 'bg-rose-50 text-rose-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                  >
                    <span className="flex-1">{opt.label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-rose-600" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── KHOẢNG NGÀY ── */}
        <button
          type="button"
          onClick={() => setShowDatePanel(!showDatePanel)}
          className={`${btnBase} ${filters.dateFrom || filters.dateTo
              ? 'bg-red-50 text-red-700 border-red-300'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
            }`}
        >
          <span>
            {filters.dateFrom || filters.dateTo ? 'Đã chọn khoảng ngày' : 'Khoảng ngày'}
          </span>
          {(filters.dateFrom || filters.dateTo) && (
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          )}
        </button>

        {/* ── NÚT XÓA LỌC ── */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetAll}
            className={`${btnBase} bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100`}
          >
            <span>Xóa lọc</span>
          </button>
        )}

        {/* ── KẾT QUẢ ── */}
        <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-600">
          <span className="text-slate-400 font-medium">Kết quả:</span>
          {filters.loaiVanBan === 'ALL' ? (
            <>
              <span className="text-red-700">{congVanCount} công văn</span>
              <span className="text-slate-300">·</span>
              <span className="text-teal-700">{chuyenDeCount} chuyên đề</span>
            </>
          ) : filters.loaiVanBan === 'CONG_VAN' ? (
            <span className="text-red-700">{totalResults} công văn</span>
          ) : (
            <span className="text-teal-700">{totalResults} chuyên đề</span>
          )}
        </div>
      </div>

      {/* Date panel */}
      {showDatePanel && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Từ ngày:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={e => update({ dateFrom: e.target.value })}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Đến ngày:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={e => update({ dateTo: e.target.value })}
              className="h-8 px-2.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
          {(filters.dateFrom || filters.dateTo) && (
            <button
              type="button"
              onClick={() => update({ dateFrom: '', dateTo: '' })}
              className="text-xs font-semibold text-red-600 hover:text-red-800 underline cursor-pointer"
            >
              Xóa khoảng ngày
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDatePanel(false)}
            className="ml-auto text-xs font-semibold text-slate-600 hover:text-slate-800 underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};

export default VtFilterBar;