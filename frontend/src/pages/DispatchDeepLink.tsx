// src/pages/DispatchDeepLink.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { Dispatch } from '../types/dispatch';
import { DispatchDetailDrawer } from '../components/DispatchDetailDrawer';
import { DEFAULT_COLUMNS } from '../constants/columns';

export const DispatchDeepLink: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [dispatch, setDispatch] = useState<Dispatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Không có ID công văn');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.getDispatchById(id);
        if (!data) {
          setError('Không tìm thấy công văn');
        } else {
          setDispatch(data);
        }
      } catch (err: any) {
        setError(err?.message || 'Lỗi tải công văn');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [id]);

  const handleClose = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-sm font-medium">Đang tải công văn...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200 p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Không tìm thấy công văn
            </h2>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-red-700 hover:bg-red-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (!dispatch) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <DispatchDetailDrawer
        dispatch={dispatch}
        onClose={handleClose}
        columns={DEFAULT_COLUMNS}
        readOnly={true}
      />
    </div>
  );
};

export default DispatchDeepLink;