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

import { Card, cn } from '../../../../design-system';
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
            {/* Recent Activity Feed */}
            <Card variant="default" padding="lg" hoverable={false} className="shadow-m3-1 border-border/60">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-black text-foreground tracking-tight uppercase tracking-widest opacity-90">
                        {t('admin.recentActivity')}
                    </h3>
                    <button
                        onClick={onViewLogs}
                        className="text-[9px] font-black text-primary uppercase tracking-[0.2em] hover:text-teams-brandHover transition-all bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-xl border border-primary/10 shadow-sm active:scale-95"
                    >
                        {t('admin.viewAllLogs')}
                    </button>
                </div>
                <div className="space-y-3">
                    {(recentActivity || []).map((activity: ActivityLogEvent) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-4 p-4 hover:bg-surface-2 rounded-2xl transition-all border border-transparent hover:border-border/50 group active:scale-[0.99]"
                        >
                            <div className={cn(
                                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                activity.type === 'new_user' ? 'bg-primary/10 text-primary' :
                                    activity.type === 'new_task_event' ? 'bg-amber-500/10 text-amber-600' :
                                        'bg-emerald-500/10 text-emerald-600'
                            )}>
                                {activity.type === 'new_user' ? <Users size={20} strokeWidth={2.5} /> :
                                    activity.type === 'new_task_event' ? <ClipboardList size={20} strokeWidth={2.5} /> :
                                        <HardDrive size={20} strokeWidth={2.5} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-foreground truncate tracking-tight leading-tight mb-1">
                                    {t(`admin.activityLog.${activity.type}`, activity.description)}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70">
                                        {activity.user}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-border" />
                                    <span className="text-[10px] font-bold text-muted-foreground/50 tabular-nums">
                                        {formatActivityDate(activity.timestamp, t)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!recentActivity?.length && (
                        <div className="text-center py-20 animate-scale-in">
                            <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <Activity size={32} className="text-muted-foreground/20" />
                            </div>
                            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] opacity-50">
                                {t('common.nothing_found')}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Unit Distribution & System Health */}
            <div className="space-y-6">
                <Card variant="default" padding="lg" hoverable={false} className="shadow-m3-1 border-border/60">
                    <h3 className="text-lg font-black text-foreground tracking-tight mb-8 uppercase tracking-widest opacity-90">
                        {t('admin.unitDistribution')}
                    </h3>
                    <div className="space-y-6">
                        {unitStats?.map((unit: UnitStat) => (
                            <div key={unit.name} className="group/unit">
                                <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5 opacity-80 group-hover/unit:opacity-100 transition-opacity">
                                    <span className="group-hover/unit:text-primary transition-colors">{unit.name}</span>
                                    <span className="text-foreground tabular-nums">{unit.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-3 rounded-full overflow-hidden shadow-inner p-0.5 border border-border/20">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_var(--teams-brand)]"
                                        style={{ width: `${unit.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* System Health Card */}
                <div className="bg-primary p-8 rounded-3xl shadow-m3-3 text-white relative overflow-hidden group active:scale-[0.98] transition-all duration-500">
                    <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000 pointer-events-none">
                        <Shield size={200} strokeWidth={1} />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-sm">
                                <Activity size={22} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black tracking-tight uppercase tracking-[0.1em]">
                                {t('admin.systemHealth')}
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg group-hover:bg-white/15 transition-colors">
                                <p className="text-[9px] uppercase font-black opacity-60 mb-2 tracking-[0.2em]">
                                    {t('admin.uptime')}
                                </p>
                                <p className="text-2xl font-black tracking-tighter tabular-nums">
                                    {systemHealth?.uptime || '99.9%'}
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg group-hover:bg-white/15 transition-colors">
                                <p className="text-[9px] uppercase font-black opacity-60 mb-2 tracking-[0.2em]">
                                    {t('admin.status')}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
                                    <span className="text-lg font-black tracking-tight uppercase">
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
