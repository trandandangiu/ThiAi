// src/types/pvt/index.ts
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';

export interface PvtSummary {
  total: number;
  choGiaoTp: number;
  daGiaoTp: number;
  choTrinhVt: number;
  daTrinhVt: number;
  hoanThanh: number;
  quaHan: number;
  sapDenHan: number;
}

export interface PvtDeptStat {
  code: string;
  name: string;
  managerName: string;
  managerId: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
}

export interface PvtTabKey {
  tab: 'dashboard' | 'cho-giao-tp' | 'da-giao-tp' | 'cho-trinh-vt' | 'da-trinh-vt' | 'phong-phu-trach';
}