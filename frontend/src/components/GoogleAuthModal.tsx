import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, QrCode, RotateCw } from 'lucide-react';
import { OTPAUTH_URL } from '../utils/totp';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCode?: (code: string) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate QR Code image data URL on mount
  useEffect(() => {
    QRCode.toDataURL(OTPAUTH_URL, {
      width: 260,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code', err));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-700 via-red-800 to-red-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Quét mã
              </h3>
              <p className="text-[11px] text-red-200 font-normal">
                Xác thực 2 bước
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Only QR Code scanning */}
        <div className="p-6 text-center">
          <p className="text-xs text-slate-600 mb-4 font-semibold">
            Quét mã QR
          </p>

          {/* QR Code Container */}
          <div className="inline-block p-3 bg-white border-2 border-dashed border-red-300 rounded-2xl shadow-md">
            {qrCodeDataUrl ? (
              <img 
                src={qrCodeDataUrl} 
                alt="Google Authenticator QR Code" 
                className="w-52 h-52 object-contain mx-auto rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                <RotateCw className="w-6 h-6 animate-spin text-red-600 mb-1" />
              </div>
            )}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer border border-slate-300"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthModal;
