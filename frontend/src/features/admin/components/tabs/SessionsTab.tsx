/**
 * SessionsTab Component
 * Active user sessions list
 */

import React from 'react';
import { Activity, Clock } from 'lucide-react';

import { Card, Avatar } from '../../../../design-system';
import { formatDuration } from '../../utils';
import type { SessionsTabProps } from '../../types';
import type { User } from '../../../../types';

export const SessionsTab: React.FC<SessionsTabProps> = ({ t, sessions, isLoading }) => (
    <Card variant="elevated" padding="none" hoverable={false} className="overflow-hidden animate-in fade-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/30">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                {t('admin.activeSessions')}
                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-lg shadow-emerald-100 animate-pulse">
                    {sessions?.length || 0} {t('common.online').toUpperCase()}
                </span>
            </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('admin.user')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('common.unit')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('admin.sessionDuration')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                            {t('admin.actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                    {isLoading ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                                <div className="animate-spin inline-block w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full" />
                            </td>
                        </tr>
                    ) : sessions && sessions.length > 0 ? (
                        sessions.map((user: User) => (
                            <tr
                                key={user.id}
                                className="hover:bg-indigo-50/30 transition-all duration-200 group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={user.avatar_url || undefined}
                                            name={user.full_name || user.username}
                                            size="sm"
                                            status="online"
                                            className="group-hover:scale-105 transition-transform"
                                        />
                                        <div className="min-w-0">
                                            <div className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                                {user.full_name || user.username}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                                        {user.unit_name || user.unit?.name || t('admin.noUnit')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                                        <Clock size={12} />
                                        {formatDuration(new Date(user.session_start || user.last_seen || new Date()), t)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wide rounded-lg hover:bg-rose-500 hover:text-white transition-all">
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Activity size={48} className="text-slate-200" />
                                    <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                        {t('admin.noActiveSessions')}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </Card>
);

export default SessionsTab;
