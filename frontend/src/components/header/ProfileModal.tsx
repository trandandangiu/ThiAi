// src/components/header/ProfileModal.tsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Building,
  Shield,
  User as UserIcon,
  Crown,
  Briefcase,
  Edit3,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { User } from '../../types/auth';
import { apiClient } from '../../services/apiClient';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdated?: (updatedUser: User) => void;
}

const getRoleLabel = (role?: string): string => {
  switch (role) {
    case 'ADMIN': return 'Quản trị viên hệ thống';
    case 'VIEN_TRUONG': return 'Viện trưởng';
    case 'PHO_VIEN_TRUONG': return 'Phó Viện trưởng';
    case 'TRUONG_PHONG': return 'Trưởng phòng';
    default: return 'Người dùng';
  }
};

const getRoleIcon = (role?: string) => {
  switch (role) {
    case 'ADMIN': return Shield;
    case 'VIEN_TRUONG': return Crown;
    case 'PHO_VIEN_TRUONG': return Shield;
    case 'TRUONG_PHONG': return Briefcase;
    default: return UserIcon;
  }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
  });

  // Sync form khi user đổi hoặc mở modal
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
      });
      setIsEditing(false);
      setError(null);
      setSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const RoleIcon = getRoleIcon(user.role);
  const initials = (user.fullName || '?')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const handleSave = async () => {
    setError(null);

    // Validate
    if (!formData.fullName.trim()) {
      setError('Họ tên không được để trống');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email không hợp lệ');
      return;
    }
    if (formData.phone && !/^[0-9+\-\s()]{8,15}$/.test(formData.phone)) {
      setError('Số điện thoại không hợp lệ (8-15 ký tự)');
      return;
    }

    setIsSaving(true);
    try {
      // Gọi API updateUser
      const res = await apiClient.updateUser(user.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        position: formData.position.trim() || undefined,
      });

      if (res) {
        setSuccess(true);
        setIsEditing(false);
        // Callback để parent refresh context
        onUpdated?.(res);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Không thể cập nhật. Vui lòng thử lại.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form về giá trị ban đầu
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      position: user.position || '',
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fadeIn">
        {/* Header gradient */}
        <div className="relative px-6 pt-8 pb-16 bg-gradient-to-br from-red-900 via-red-800 to-amber-900">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="dots-profile" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.2" fill="white" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dots-profile)" />
            </svg>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <div className="relative flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-4 border-white shadow-2xl flex items-center justify-center">
              <span className="text-3xl font-black text-white tracking-wider">{initials}</span>
            </div>
            <div className="mt-3 text-center">
              <h2 className="text-xl font-black text-white">
                {isEditing ? formData.fullName || 'Chưa có tên' : user.fullName}
              </h2>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded-full border border-white/25">
                <RoleIcon className="w-3 h-3 text-amber-300" />
                <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider">
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="-mt-10 mx-6 relative">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 space-y-3">
            {/* Success alert */}
            {success && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Cập nhật thông tin thành công!</span>
              </div>
            )}

            {/* Error alert */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Info rows */}
            <InfoRow
              icon={UserIcon}
              label="Tên đăng nhập"
              value={user.username || '—'}
              mono
              readOnly
            />

            {/* Full Name — editable */}
            <EditableRow
              icon={UserIcon}
              label="Họ và tên"
              value={user.fullName || '—'}
              formValue={formData.fullName}
              onChange={v => setFormData({ ...formData, fullName: v })}
              isEditing={isEditing}
              placeholder="Nguyễn Văn A"
            />

            {/* Role — read only */}
            {/* <InfoRow
              icon={Shield}
              label="Vai trò hệ thống"
              value={`${user.role || '—'}${user.roomCode ? ` • ${user.roomCode}` : ''}`}
              readOnly
            />

            {/* Email — editable */}
            <EditableRow
              icon={Mail}
              label="Email"
              value={user.email || 'Chưa cập nhật'}
              formValue={formData.email}
              onChange={v => setFormData({ ...formData, email: v })}
              isEditing={isEditing}
              placeholder="example@vks.gov.vn"
              type="email"
            />

            {/* Phone — editable */}
            <EditableRow
              icon={Phone}
              label="Số điện thoại"
              value={user.phone || 'Chưa cập nhật'}
              formValue={formData.phone}
              onChange={v => setFormData({ ...formData, phone: v })}
              isEditing={isEditing}
              placeholder="0912345678"
              type="tel"
            />

            {/* Position — editable */}
            {/* <EditableRow
              icon={Briefcase}
              label="Chức danh"
              value={user.position || 'Chưa cập nhật'}
              formValue={formData.position}
              onChange={v => setFormData({ ...formData, position: v })}
              isEditing={isEditing}
              placeholder="Kiểm sát viên"
            /> */}

            {/* Department — read only */}
            <InfoRow
              icon={Building}
              label="Phòng ban / Đơn vị"
              value={user.roomCode || user.department?.name || '—'}
              mono
              readOnly
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            ID: <span className="font-mono text-slate-700">{user.id.slice(0, 8)}...</span>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// INFO ROW (read-only)
// ============================================
interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
  readOnly?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon: Icon, label, value, mono }) => (
  <div className="flex items-start gap-3 py-1.5">
    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div
        className={`text-sm mt-0.5 ${
          mono ? 'font-mono font-bold text-slate-900' : 'font-semibold text-slate-800'
        }`}
      >
        {value}
      </div>
    </div>
  </div>
);

// ============================================
// EDITABLE ROW
// ============================================
interface EditableRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  formValue: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  placeholder?: string;
  type?: string;
}

const EditableRow: React.FC<EditableRowProps> = ({
  icon: Icon,
  label,
  value,
  formValue,
  onChange,
  isEditing,
  placeholder,
  type = 'text',
}) => (
  <div className="flex items-start gap-3 py-1.5">
    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      {isEditing ? (
        <input
          type={type}
          value={formValue}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition"
        />
      ) : (
        <div className="text-sm font-semibold text-slate-800">
          {value}
        </div>
      )}
    </div>
  </div>
);

export default ProfileModal;