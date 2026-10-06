// src/components/public/PublicFooter.tsx
import React from 'react';
import { Building2, MapPin, Phone, Mail, Globe, ShieldCheck } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-8 bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cột 1: Đơn vị */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/logo.svg"
                alt="Logo VKS"
                className="w-12 h-12 object-contain"
              />
              <div>
                <div className="text-[10px] font-black tracking-widest uppercase text-amber-300">
                  Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh
                </div>
                <div className="text-base font-black">
                  Hệ thống quản lý công việc
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hệ thống theo dõi, giám sát tiến độ xử lý công văn và báo cáo
              kết quả của các cấp Lãnh đạo.
            </p>
          </div>

          {/* Cột 2: Liên hệ */}
          <div>
            <h3 className="text-xs font-black tracking-widest uppercase text-amber-300 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Liên hệ
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0" />
                <span>Số 1 Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>(028) 38 222 222</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>contact@vks.hcm.gov.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>vks.hcm.gov.vn</span>
              </li>
            </ul>
          </div>

          {/* Cột 3: Hệ thống */}
          <div>
            <h3 className="text-xs font-black tracking-widest uppercase text-amber-300 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Hệ thống
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Đang hoạt động bình thường
                </span>
              </li>
              <li>Phiên bản: 1.0.0</li>
              <li>Cập nhật: {currentYear}</li>
              <li className="pt-2 text-[10px] text-slate-400 italic">
                Hệ thống nội bộ - mạng LAN 
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div>
            © {currentYear} Viện Kiểm sát nhân dân Thành phố Hồ Chí Minh
          </div>
          <div className="flex items-center gap-4">
            <span>Văn Phòng - Bộ phận Chuyển đổi số </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;