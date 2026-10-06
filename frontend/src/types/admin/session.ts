// src/types/admin/session.ts

export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}