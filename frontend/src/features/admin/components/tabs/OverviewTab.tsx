/**
 * OverviewTab Component
 * Dashboard overview with stats, charts, and system health
 */

import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Users, Activity, BarChart2, HardDrive, Shield, ClipboardList } from 'lucide-react';

import { Card } from '../../../../design-system';
import { StatCard } from '../StatCard';
import { formatBytes, formatActivityDate, formatChartDate } from '../../utils';
import type { OverviewTabProps, StorageStat, UnitStat, ActivityLogEvent } from '../../types';

export const OverviewTab: React.FC<OverviewTabProps> = ({
    t,
    stats,
    activityData,
    storageData,
    unitStats,
    recentActivity,
    systemHealth,
    onViewLogs
}) => (
    <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title={t('admin.totalUsers')}
                value={stats?.total_users || 0}
                icon={<Users />}
                color="indigo"
                subValue={t('admin.totalAccounts')}
                trend="+12%"
                t={t}
            />
            <StatCard
                title={t('admin.onlineNow')}
                value={stats?.online_users || 0}
                icon={<Activity />}
                color="emerald"
                isLive={true}
                t={t}
            />
            <StatCard
                title={t('admin.messagesToday')}
                value={stats?.messages_today || 0}
                icon={<BarChart2 />}
                color="violet"
                trend="+40%"
                t={t}
            />
            <StatCard
                title={t('admin.storageUsed')}
                value={formatBytes(stats?.total_storage_size || 0)}
                icon={<HardDrive />}
                color="amber"
                subValue={`${stats?.total_files || 0} ${t('admin.files')}`}
                t={t}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Trend Chart */}
            <Card variant="elevated" padding="lg" hoverable={false} className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 leading-none tracking-tight mb-1">
                            {t('admin.activityTrend')}
                        </h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t('admin.last30Days')}
                        </p>
                    </div>
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart data={activityData || []}>
                            <defs>
                                <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                dy={10}
                                tickFormatter={formatChartDate}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '16px',
                                    border: '1px solid #eef2ff',
                                    fontWeight: 900,
                                    fontSize: '12px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    backdropFilter: 'blur(10px)'
                                }}
                                cursor={{ stroke: '#4f46e5', strokeWidth: 2, strokeDasharray: '5 5' }}
                                labelFormatter={(value) => formatActivityDate(value, t)}
                                formatter={(value: number | string | undefined) => [value, t('admin.messagesToday')]}
                            />
                            <Area
                                type="monotone"
                                dataKey="messages"
                                stroke="#4f46e5"
                                strokeWidth={4}
                                fillOpacity={1}
                                fill="url(#colorMessages)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Storage Breakdown */}
            <Card variant="elevated" padding="lg" hoverable={false} className="relative overflow-hidden">
                <div className="absolute top-6 left-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {t('admin.storageUsage')}
                    </h3>
                </div>
                <div className="h-64 w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <PieChart>
                            <Pie
                                data={(storageData || []).map(item => ({
                                    ...item,
                                    name: t(`admin.storageTypes.${item.name}`, item.name)
                                }))}
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {(storageData || []).map((entry: StorageStat, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontWeight: 800,
                                    color: '#1e293b',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                }}
                                formatter={(value: number | string | undefined) => [
                                    typeof value === 'number' ? formatBytes(value) : (value || ''),
                                    t('admin.size')
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="pb-3">{t('admin.type')}</th>
                            <th className="pb-3 text-right">{t('admin.size')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(storageData || []).map((item: StorageStat) => (
                            <tr key={item.name} className="group/item">
                                <td className="py-2.5 flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">
                                        {t(`admin.storageTypes.${item.name}`, item.name)}
                                    </span>
                                </td>
                                <td className="py-2.5 text-right font-black text-slate-900 text-[11px]">
                                    {formatBytes(item.value)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Feed */}
            <Card variant="elevated" padding="lg" hoverable={false}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        {t('admin.recentActivity')}
                    </h3>
                    <button
                        onClick={onViewLogs}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-400 transition-colors bg-indigo-50 px-3 py-2 rounded-xl"
                    >
                        {t('admin.viewAllLogs')}
                    </button>
                </div>
                <div className="space-y-3">
                    {(recentActivity || []).map((activity: ActivityLogEvent) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-4 p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-50 group"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activity.type === 'new_user' ? 'bg-indigo-50 text-indigo-600' :
                                    activity.type === 'new_task_event' ? 'bg-amber-50 text-amber-600' :
                                        'bg-emerald-50 text-emerald-600'
                                }`}>
                                {activity.type === 'new_user' ? <Users size={18} /> :
                                    activity.type === 'new_task_event' ? <ClipboardList size={18} /> :
                                        <HardDrive size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">
                                    {t(`admin.activityLog.${activity.type}`, activity.description)}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {activity.user}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span className="text-[10px] font-bold text-slate-300">
                                        {formatActivityDate(activity.timestamp, t)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!recentActivity?.length && (
                        <div className="text-center py-10">
                            <p className="text-slate-300 font-black text-xs uppercase tracking-widest">
                                {t('common.nothing_found')}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Unit Distribution & System Health */}
            <div className="space-y-6">
                <Card variant="elevated" padding="lg" hoverable={false}>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6">
                        {t('admin.unitDistribution')}
                    </h3>
                    <div className="space-y-4">
                        {unitStats?.map((unit: UnitStat) => (
                            <div key={unit.name}>
                                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                    <span>{unit.name}</span>
                                    <span className="text-slate-900">{unit.value}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${unit.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* System Health Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Shield size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-black tracking-tight mb-4 uppercase">
                            {t('admin.systemHealth')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
                                <p className="text-[10px] uppercase font-black opacity-60 mb-1">
                                    {t('admin.uptime')}
                                </p>
                                <p className="text-base font-black tracking-tight">
                                    {systemHealth?.uptime || '99.9%'}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3">
                                <p className="text-[10px] uppercase font-black opacity-60 mb-1">
                                    {t('admin.systemHealth')}
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                    <span className="text-base font-black tracking-tight uppercase">
                                        {t('admin.systemStatus.optimal')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default OverviewTab;
