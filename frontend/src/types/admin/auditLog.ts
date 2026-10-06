// src/types/admin/auditLog.ts

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  endpoint?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    fullName: string;
  };
}