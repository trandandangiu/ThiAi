// src/components/vt/VtAdvancedCharts.tsx
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { VtTrendPoint, VtPvtStat, VtTpStat } from '../../types/vt';

// ============================================
// Chart 1: Trend 30 ngày (Line + Area)
// ============================================
interface VtTrendChartProps {
  data: VtTrendPoint[];
}

export const VtTrendChart: React.FC<VtTrendChartProps> = ({ data }) => {
  // Format date for display: 'DD/MM'
  const formatted = useMemo(() => {
    return data.map(p => ({
      ...p,
      label: `${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`,
    }));
  }, [data]);

  const totalNew = data.reduce((s, p) => s + p.newCount, 0);
  const totalCompleted = data.reduce((s, p) => s + p.completedCount, 0);

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Xu hướng 30 ngày gần nhất</h3>
            <p className="text-xs text-slate-500">
              <span className="text-blue-600 font-bold">+{totalNew}</span> CV mới •{' '}
              <span className="text-emerald-600 font-bold">+{totalCompleted}</span> hoàn thành
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              labelStyle={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}
              formatter={(value: any, name: any) => [
                `${value} CV`,
                name === 'newCount' ? 'CV mới' : 'Hoàn thành',
              ]}
            />
            <Area
              type="monotone"
              dataKey="newCount"
              stroke="#3B82F6"
              strokeWidth={2.5}
              fill="url(#gradNew)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="completedCount"
              stroke="#10B981"
              strokeWidth={2.5}
              fill="url(#gradDone)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================
// Chart 2: Top 5 PVT (Horizontal Bar)
// ============================================
interface VtTopPvtChartProps {
  pvtStats: VtPvtStat[];
}

export const VtTopPvtChart: React.FC<VtTopPvtChartProps> = ({ pvtStats }) => {
  const topData = useMemo(() => {
    return [...pvtStats]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(p => ({
        name: p.roomCode || p.name.slice(0, 10),
        fullName: p.name,
        total: p.total,
        completed: p.completed,
        overdue: p.overdue,
      }));
  }, [pvtStats]);

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white flex items-center justify-center shadow-md">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top 5 PVT có khối lượng lớn nhất</h3>
            <p className="text-xs text-slate-500">Xếp theo tổng số công văn được giao</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={topData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 700 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value: any, name: any) => [
                `${value} CV`,
                name === 'total' ? 'Tổng' : name === 'completed' ? 'Hoàn thành' : 'Quá hạn',
              ]}
              labelFormatter={(label: any) => {
                const item = topData.find(d => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              iconType="circle"
              formatter={(value: any) =>
                value === 'total' ? 'Tổng' : value === 'completed' ? 'Hoàn thành' : 'Quá hạn'
              }
            />
            <Bar dataKey="total" fill="#6366F1" radius={[0, 6, 6, 0]} barSize={14} />
            <Bar dataKey="completed" fill="#10B981" radius={[0, 6, 6, 0]} barSize={14} />
            <Bar dataKey="overdue" fill="#EF4444" radius={[0, 6, 6, 0]} barSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================
// Chart 3: Dept Comparison (Stacked Bar)
// ============================================
interface VtDeptChartProps {
  tpStats: VtTpStat[];
}

export const VtDeptChart: React.FC<VtDeptChartProps> = ({ tpStats }) => {
  const chartData = useMemo(() => {
    return tpStats
      .filter(t => t.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 12)
      .map(t => ({
        name: t.code,
        fullName: t.name,
        completed: t.completed,
        inProgress: t.total - t.completed - t.overdue,
        overdue: t.overdue,
        total: t.total,
      }));
  }, [tpStats]);

  return (
    <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">So sánh tình hình xử lý các phòng</h3>
            <p className="text-xs text-slate-500">Hoàn thành / Đang xử lý / Quá hạn theo từng phòng</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
              formatter={(value: any, name: any) => [
                `${value} CV`,
                name === 'completed' ? 'Hoàn thành' : name === 'inProgress' ? 'Đang xử lý' : 'Quá hạn',
              ]}
              labelFormatter={(label: any) => {
                const item = chartData.find(d => d.name === label);
                return item ? `${label} — ${item.fullName}` : label;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
              iconType="circle"
              formatter={(value: any) =>
                value === 'completed' ? 'Hoàn thành' : value === 'inProgress' ? 'Đang xử lý' : 'Quá hạn'
              }
            />
            <Bar dataKey="completed" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="inProgress" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="overdue" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default { VtTrendChart, VtTopPvtChart, VtDeptChart };