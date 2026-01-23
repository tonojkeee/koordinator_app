/**
 * TasksTab Component
 * Admin view of all tasks with statistics
 */

import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { ClipboardList, CheckCircle2, Clock, AlertCircle, RefreshCw, Search, Trash2 } from 'lucide-react';

import { Card, Button } from '../../../../design-system';
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
        { name: t('admin.tasksCompleted'), value: stats?.tasks_completed || 0, color: '#10b981' },
        { name: t('admin.tasksInProgress'), value: stats?.tasks_in_progress || 0, color: '#6366f1' },
        { name: t('admin.tasksOnReview'), value: stats?.tasks_on_review || 0, color: '#f59e0b' },
        { name: t('admin.tasksOverdue'), value: stats?.tasks_overdue || 0, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
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
                <Card variant="elevated" padding="lg" hoverable={false}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">{t('admin.tasksByStatus')}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={taskStatusData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {taskStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontWeight: 600,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card variant="elevated" padding="lg" hoverable={false}>
                    <h3 className="text-lg font-bold text-slate-900 mb-6">{t('admin.tasksByUnit')}</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={taskUnitStats}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 600 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('admin.tasksTotal')} />
                                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name={t('admin.tasksCompleted')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Tasks Table */}
            <Card variant="elevated" padding="none" hoverable={false} className="overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/30">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('common.search_placeholder')}
                            className="pl-12 pr-4 py-3 bg-slate-100/50 border-none rounded-xl text-sm font-semibold w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('common.name')}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('admin.issuer')}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('admin.assignee')}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('admin.status')}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('admin.deadline')}</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <RefreshCw className="animate-spin mx-auto text-indigo-500" />
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-indigo-50/30 transition-all duration-200 group">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{task.title}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{task.issuer?.full_name || task.issuer?.username}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{task.assignee?.full_name || task.assignee?.username}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                task.status === 'overdue' ? 'bg-rose-50 text-rose-600' :
                                                    task.status === 'on_review' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-indigo-50 text-indigo-600'
                                                }`}>
                                                {t(`tasks.status.${task.status}`, task.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(task.deadline).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<Trash2 size={16} />}
                                                onClick={() => {
                                                    if (window.confirm(t('admin.deleteTaskConfirm'))) {
                                                        onDeleteTask(task.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            />
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
