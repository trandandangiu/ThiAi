// src/types/vt/stats.ts
import { Dispatch } from '../../types/dispatch';

export interface VtSummary {
  total: number;
  daPhanCongPvt: number;
  chuaPhanCongPvt: number;
  hoanThanh: number;
  dangXuLy: number;
  sapDenHan: number;
  quaHan: number;
  rateOnTime: number;
}

export interface VtPvtStat {
  id: string;
  name: string;
  roomCode: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionRate: number;
  avgHandlingDays?: number;
}

export interface VtTpStat {
  id: string;
  code: string;
  name: string;
  pvtManagerName?: string;
  total: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export interface VtTrendPoint {
  date: string;        // 'YYYY-MM-DD'
  newCount: number;    // CV mới trong ngày
  completedCount: number;
}

export interface VtHeatmapCell {
  deptCode: string;
  date: string;
  count: number;
}