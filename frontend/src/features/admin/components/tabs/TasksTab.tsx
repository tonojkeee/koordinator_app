/**
 * TasksTab Component
 * Admin view of all tasks with statistics
 */

import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { ClipboardList, CheckCircle2, Clock, AlertCircle, RefreshCw, Search, Trash2, Loader2 } from 'lucide-react';

import { Card, cn } from '../../../../design-system';
import { StatCard } from '../StatCard';
import type { TasksTabProps } from '../../types';

export const TasksTab: React.FC<TasksTabProps> = ({
    t,
    stats,
    taskUnitStats,
    allTasks,
    isLoading,
    onDeleteTask
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTasks = allTasks?.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.issuer?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const taskStatusData = [
        { name: t('admin.tasksCompleted'), value: stats?.tasks_completed || 0, color: 'var(--color-green-500)' },
        { name: t('admin.tasksInProgress'), value: stats?.tasks_in_progress || 0, color: 'var(--teams-brand)' },
        { name: t('admin.tasksOnReview'), value: stats?.tasks_on_review || 0, color: 'var(--color-amber-500)' },
        { name: t('admin.tasksOverdue'), value: stats?.tasks_overdue || 0, color: 'var(--destructive)' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard title={t('admin.tasksTotal')} value={stats?.tasks_total || 0} icon={<ClipboardList />} color="indigo" t={t} />
                <StatCard title={t('admin.tasksCompleted')} value={stats?.tasks_completed || 0} icon={<CheckCircle2 />} color="emerald" t={t} />
                <StatCard title={t('admin.tasksInProgress')} value={stats?.tasks_in_progress || 0} icon={<Clock />} color="violet" t={t} />
                <StatCard title={t('admin.tasksOnReview')} value={stats?.tasks_on_review || 0} icon={<RefreshCw />} color="amber" t={t} />
                <StatCard title={t('admin.tasksOverdue')} value={stats?.tasks_overdue || 0} icon={<AlertCircle />} color="rose" t={t} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card
                    variant="default"
                    padding="lg"
                    hoverable={false}
                    className="border-border/60"
                    style={{ boxShadow: 'var(--shadow-subtle)' }}
                >
                    <h3 className="text-lg font-black text-foreground mb-8 uppercase tracking-widest opacity-90">{t('admin.tasksByStatus')}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={6}
                                    dataKey="value"
                                    animationDuration={1500}
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--surface)',
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        fontWeight: 900,
                                        fontSize: '11px',
                                        boxShadow: 'var(--shadow-medium)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card
                    variant="default"
                    padding="lg"
                    hoverable={false}
                    className="border-border/60"
                    style={{ boxShadow: 'var(--shadow-subtle)' }}
                >
                    <h3 className="text-lg font-black text-foreground mb-8 uppercase tracking-widest opacity-90">{t('admin.tasksByUnit')}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={taskUnitStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)', opacity: 0.7 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 9, fontWeight: 900, fill: 'var(--muted-foreground)', opacity: 0.7 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'var(--surface-2)' }}
                                    contentStyle={{
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-medium)',
                                        fontWeight: 900,
                                        fontSize: '11px'
                                    }}
                                />
                                <Bar dataKey="total" fill="var(--teams-brand)" radius={[6, 6, 0, 0]} name={t('admin.tasksTotal')} animationDuration={1500} />
                                <Bar dataKey="completed" fill="var(--color-green-500)" radius={[6, 6, 0, 0]} name={t('admin.tasksCompleted')} animationDuration={1500} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Tasks Table */}
            <Card
                variant="default"
                padding="none"
                hoverable={false}
                className="overflow-hidden border-border/60"
                style={{ boxShadow: 'var(--shadow-subtle)' }}
            >
                <div
                    className="border-b border-border flex justify-between items-center bg-surface-1/50"
                    style={{ padding: 'var(--spacing-lg)' }}
                >
                    <div className="relative group flex-1 max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors" size={18} strokeWidth={2.5} />
                        <input
                            type="text"
                            placeholder={t('common.search_placeholder')}
                            className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-inner placeholder:text-muted-foreground/40 uppercase tracking-widest text-[11px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                borderRadius: 'var(--radius)',
                                transitionDuration: 'var(--duration-fast)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-2/80 border-b border-border">
                                <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">{t('common.name')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">{t('admin.issuer')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">{t('admin.assignee')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">{t('admin.status')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">{t('admin.deadline')}</th>
                                <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary" size={32} strokeWidth={3} />
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr
                                        key={task.id}
                                        className="hover:bg-primary/5 group active:bg-primary/10"
                                        style={{
                                            transitionDuration: 'var(--duration-normal)',
                                            transitionTimingFunction: 'var(--easing-out)'
                                        }}
                                    >
                                        <td className="px-8 py-5">
                                            <span className="font-black text-foreground text-sm tracking-tight group-hover:text-primary transition-colors">{task.title}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-muted-foreground opacity-80">{task.issuer?.full_name || task.issuer?.username}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-muted-foreground opacity-80">{task.assignee?.full_name || task.assignee?.username}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm transition-all",
                                                task.status === 'completed' ? 'bg-green-500/10 text-green-700 border-green-500/20' :
                                                    task.status === 'overdue' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                        task.status === 'on_review' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' :
                                                            'bg-primary/10 text-primary border-primary/20'
                                            )}>
                                                {t(`tasks.status.${task.status}`, task.status)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-black text-muted-foreground/60 tabular-nums uppercase tracking-widest">{new Date(task.deadline).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(t('admin.deleteTaskConfirm'))) {
                                                        onDeleteTask(task.id);
                                                    }
                                                }}
                                                className="w-9 h-9 flex items-center justify-center bg-surface-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50 shadow-sm opacity-0 group-hover:opacity-100"
                                                style={{
                                                    borderRadius: 'var(--radius)',
                                                    transitionDuration: 'var(--duration-fast)',
                                                    transitionTimingFunction: 'var(--easing-out)'
                                                }}
                                            >
                                                <Trash2 size={16} strokeWidth={2.5} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default TasksTab;
