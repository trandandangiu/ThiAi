// frontend/src/services/apiClient.ts
import { Dispatch } from '../types/dispatch';
import { User, LoginResponse, VTDashboardStatsResponse } from '../types/auth';

const API_BASE = '/api';

// Token keys
const TOKEN_KEY = 'access_token';
const USER_KEY = 'current_user';

// ============================================
// ⭐ REQUEST — Ném lỗi thật lên FE
// ============================================
async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // ⭐ ĐỌC BODY 1 LẦN DUY NHẤT
  let body: any = null;
  const contentType = res.headers.get('content-type');
  try {
    if (contentType?.includes('application/json')) {
      body = await res.json();
    } else {
      body = await res.text();
    }
  } catch (parseErr) {
    console.error('Lỗi parse response:', parseErr);
    body = null;
  }

  // ⭐ NÉM LỖI THẬT LÊN FE
  if (!res.ok) {
    // Xóa token khi 401 — buộc login lại
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }

    const message =
      (typeof body === 'object' && body?.message) ||
      (typeof body === 'string' && body) ||
      `Lỗi server (${res.status})`;

    const error: any = new Error(message);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body as T;
}

// ============================================
// API CLIENT
// ============================================
export const apiClient = {
  // ============================================
  // 1. AUTH
  // ============================================
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return { success: false, message: `Lỗi server (${res.status})` };
      }

      const data = await res.json();

      if (data.success && data.user && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (e: any) {
      console.error('Lỗi login:', e);
      return { success: false, message: e.message };
    }
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // ⭐ fetchCurrentUser — ném lỗi để AuthContext xử lý
  async fetchCurrentUser(): Promise<User | null> {
    const data = await request<{ success: boolean; user: User }>('/auth/me');
    if (data.success && data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
    return null;
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Bỏ qua lỗi logout
      console.error('Logout error:', e);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  // ⭐ changePassword — ném lỗi để UI hiển thị
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string }> {
    return await request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  // ============================================
  // 2. USERS
  // ============================================
  // ⭐ getAllUsers — ném lỗi, caller tự catch
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }): Promise<User[]> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);

    const data = await request<{ success: boolean; users: User[] }>(
      `/users?${query.toString()}`
    );
    return data.success ? data.users : [];
  },

  async createUser(
    userData: Partial<User & { password?: string; roleIds?: number[] }>
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    return await request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(
    id: string,
    updates: Partial<User & { password?: string }>
  ): Promise<User | null> {
    const data = await request<{ success: boolean; user: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.success ? data.user : null;
  },

  async deleteUser(id: string): Promise<{ success: boolean; message?: string }> {
    return await request(`/users/${id}`, { method: 'DELETE' });
  },

  async resetPassword(
    id: string,
    newPassword?: string
  ): Promise<{ success: boolean; message?: string; newPassword?: string }> {
    return await request(`/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  async assignRoles(
    userId: string,
    roleIds: number[]
  ): Promise<{ success: boolean; message?: string }> {
    return await request(`/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roleIds }),
    });
  },

  async toggleActive(
    userId: string
  ): Promise<{ success: boolean; message?: string; active?: boolean }> {
    return await request(`/users/${userId}/toggle-active`, {
      method: 'PATCH',
    });
  },

  // ============================================
  // 3. DISPATCHES
  // ============================================
  async getDispatches(params?: {
    page?: number;
    limit?: number;
    search?: string;
    trangThai?: string;
    mucDoKhan?: string;
    role?: string;
    userId?: string;
    roomCode?: string;
    assignedPvtId?: string;
    assignedTpId?: string;
    dateFrom?: string;
    dateTo?: string;
    includeDeleted?: boolean;
  }): Promise<Dispatch[]> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    if (params?.trangThai) query.set('trangThai', params.trangThai);
    if (params?.mucDoKhan) query.set('mucDoKhan', params.mucDoKhan);
    if (params?.role) query.set('role', params.role);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.roomCode) query.set('roomCode', params.roomCode);
    if (params?.assignedPvtId) query.set('assignedPvtId', params.assignedPvtId);
    if (params?.assignedTpId) query.set('assignedTpId', params.assignedTpId);
    if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
    if (params?.dateTo) query.set('dateTo', params.dateTo);

    const data = await request<{ success: boolean; dispatches: Dispatch[] }>(
      `/dispatches?${query.toString()}`
    );
    return data.success ? data.dispatches : [];
  },

  async getDispatchById(id: string): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${id}`
    );
    return data.success ? data.dispatch : null;
  },

  async createDispatch(dispatchData: Partial<Dispatch>): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      '/dispatches',
      {
        method: 'POST',
        body: JSON.stringify(dispatchData),
      }
    );
    return data.success ? data.dispatch : null;
  },

  async updateDispatch(
    id: string,
    updates: Partial<Dispatch>
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
    return data.success ? data.dispatch : null;
  },

  async markComplete(
    id: string,
    note?: string
  ): Promise<{ success: boolean; message?: string; dispatch?: Dispatch }> {
    return await request(`/dispatches/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },

  async deleteDispatch(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/dispatches/${id}`, {
      method: 'DELETE',
    });
    return !!data.success;
  },
  async reopenDispatch(
    id: string,
    note?: string
  ): Promise<{ success: boolean; message?: string; dispatch?: Dispatch }> {
    return await request(`/dispatches/${id}/reopen`, {
      method: 'PATCH',
      body: JSON.stringify({ note }),
    });
  },

  // ============================================
  // 4. ATTACHMENTS
  // ============================================
  async uploadAttachment(
    dispatchId: string,
    file: File,
    fileCategory: string = 'ORIGINAL',
    description?: string
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileCategory', fileCategory);
    if (description) formData.append('description', description);

    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(
      `${API_BASE}/dispatches/${dispatchId}/attachments`,
      {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      throw new Error(data?.message || `Upload lỗi (${res.status})`);
    }

    return data;
  },

  async getAttachments(dispatchId: string): Promise<any[]> {
    const data = await request<{ success: boolean; attachments: any[] }>(
      `/dispatches/${dispatchId}/attachments`
    );
    return data.success ? data.attachments : [];
  },

  async downloadAttachment(attachmentId: string): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(
      `${API_BASE}/attachments/${attachmentId}/download`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
      throw new Error(`Không tải được file (${res.status})`);
    }
    

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const contentDisposition = res.headers.get('content-disposition');
    let fileName = 'attachment';
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) fileName = decodeURIComponent(match[1]);
    }
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
  // ⭐ Đọc nội dung file text (không dùng blob URL)
  async getAttachmentTextContent(attachmentId: string): Promise<string> {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(
      `${API_BASE}/attachments/${attachmentId}/download`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Không thể đọc file (${res.status})`);
    }

    return await res.text();
  },
  // ⭐ Tải file thành Blob URL để xem trực tiếp (không lưu về máy)
  async getAttachmentBlobUrl(attachmentId: string): Promise<string> {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(
      `${API_BASE}/attachments/${attachmentId}/download`,
      {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Không thể tải file (${res.status})`);
    }

    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  async deleteAttachment(attachmentId: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(
      `/attachments/${attachmentId}`,
      { method: 'DELETE' }
    );
    return !!data.success;
  },

  // ============================================
  // 5. ASSIGNMENTS
  // ============================================
  async assignToPvts(
    dispatchId: string,
    payload: {
      pvts: { pvtId: string; pvtName: string; roomCode?: string; isPrimary?: boolean }[];
      vtChiDao?: string;
      hanBaoCaoXuLy?: string;
      mucDoKhan?: string;
    }
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/assign-pvts`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return data.success ? data.dispatch : null;
  },

  async assignToTps(
    dispatchId: string,
    payload: {
      tps: { tpId: string; tpName: string; roomCode?: string; isPrimary?: boolean }[];
      pvtChiDao?: string;
      hanBaoCaoXuLy?: string;
    }
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/assign-tps`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return data.success ? data.dispatch : null;
  },

  async tpNumber(
    dispatchId: string,
    payload: { soCongVanTP: string; ngayDanhSo?: string }
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/tp-number`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return data.success ? data.dispatch : null;
  },

  async tpSubmit(
    dispatchId: string,
    payload: { baoCaoTienDo: string; tienDo?: number }
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/tp-submit`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return data.success ? data.dispatch : null;
  },

  async pvtSubmit(
    dispatchId: string,
    payload: { pvtChiDao: string }
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/pvt-submit`,
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return data.success ? data.dispatch : null;
  },

  async vtAgree(dispatchId: string): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/vt-agree`,
      { method: 'POST' }
    );
    return data.success ? data.dispatch : null;
  },

  async vtDisagree(dispatchId: string, reason: string): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/vt-disagree`,
      { method: 'POST', body: JSON.stringify({ reason }) }
    );
    return data.success ? data.dispatch : null;
  },

  async pvtDisagree(
    dispatchId: string,
    reason: string,
    tpId?: string
  ): Promise<Dispatch | null> {
    const data = await request<{ success: boolean; dispatch: Dispatch }>(
      `/dispatches/${dispatchId}/pvt-disagree`,
      { method: 'POST', body: JSON.stringify({ reason, tpId }) }
    );
    return data.success ? data.dispatch : null;
  },

  async getHistory(dispatchId: string): Promise<any[]> {
    const data = await request<{ success: boolean; history: any[] }>(
      `/dispatches/${dispatchId}/history`
    );
    return data.success ? data.history : [];
  },

  // ============================================
  // 6. STATS
  // ============================================
  async getVTDashboardStats(): Promise<VTDashboardStatsResponse | null> {
    const data = await request<VTDashboardStatsResponse>('/stats/vt-overview');
    return data.success ? data : null;
  },

  async getChartData(): Promise<any | null> {
    const data = await request<any>('/stats/chart');
    return data.success ? data : null;
  },
  

  // ============================================
  // 7. NOTIFICATIONS
  // ============================================
  async getNotifications(params?: { page?: number; isRead?: boolean }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.isRead !== undefined) query.set('isRead', String(params.isRead));

    const data = await request<{ success: boolean; notifications: any[] }>(
      `/notifications?${query.toString()}`
    );
    return data.success ? data.notifications : [];
  },

  async getUnreadCount(): Promise<number> {
    const data = await request<{ success: boolean; unreadCount: number }>(
      '/notifications/unread-count'
    );
    return data.success ? data.unreadCount : 0;
  },

  // ⭐ Trả về unreadCount
  async markNotificationRead(id: string): Promise<{ success: boolean; unreadCount?: number }> {
    const data = await request<{ success: boolean; unreadCount?: number }>(
      `/notifications/${id}/read`,
      { method: 'PATCH' }
    );
    return data;
  },

  async markAllNotificationsRead(): Promise<{ success: boolean; unreadCount?: number }> {
    const data = await request<{ success: boolean; unreadCount?: number }>(
      '/notifications/read-all',
      { method: 'PATCH' }
    );
    return data;
  },

  async deleteNotification(id: string): Promise<{ success: boolean; unreadCount?: number }> {
    const data = await request<{ success: boolean; unreadCount?: number }>(
      `/notifications/${id}`,
      { method: 'DELETE' }
    );
    return data;
  },


  // Public — không cần token
  async verifyPvtUsername(
    username: string,
    pvtId: string
  ): Promise<{ success: boolean; message?: string; pvt?: { id: string; fullName: string; roomCode?: string } }> {
    try {
      const res = await fetch(`${API_BASE}/users/verify-pvt-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pvtId }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, message: err?.message || 'Lỗi kết nối' };
    }
  },

  async hardDeleteDispatch(id: string): Promise<boolean> {
  const data = await request<{ success: boolean }>(
    `/dispatches/${id}/hard-delete`,
    { method: 'DELETE' }
  );
  return !!data.success;
},
};