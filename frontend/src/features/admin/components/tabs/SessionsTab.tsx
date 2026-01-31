/**
 * SessionsTab Component
 * Active user sessions list
 */

import React from 'react';
import { Activity, Clock, Loader2 } from 'lucide-react';

import { Card, Avatar } from '../../../../design-system';
import { formatDuration } from '../../utils';
import type { SessionsTabProps } from '../../types';
import type { User } from '../../../../types';

export const SessionsTab: React.FC<SessionsTabProps> = ({ t, sessions, isLoading }) => (
    <Card
        variant="default"
        padding="none"
        hoverable={false}
        className="overflow-hidden animate-fade-in border-border/60"
        style={{ boxShadow: 'var(--shadow-subtle)' }}
    >
        {/* Header */}
        <div className="p-8 border-b border-border flex justify-between items-center bg-surface-1/50">
            <h3 className="text-lg font-black text-foreground flex items-center gap-4 uppercase tracking-tight">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <Activity size={20} strokeWidth={2.5} />
                </div>
                {t('admin.activeSessions')}
                <span
                    className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black rounded-full animate-pulse uppercase tracking-[0.2em] ml-2"
                    style={{ boxShadow: 'var(--shadow-subtle)' }}
                >
                    {sessions?.length || 0} {t('common.online')}
                </span>
            </h3>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-surface-2/80 border-b border-border">
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                            {t('admin.user')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                            {t('common.unit')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                            {t('admin.sessionDuration')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] text-right">
                            {t('admin.actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {isLoading ? (
                        <tr>
                            <td colSpan={4} className="px-8 py-24 text-center">
                                <Loader2 className="animate-spin mx-auto text-primary" size={32} strokeWidth={3} />
                            </td>
                        </tr>
                    ) : sessions && sessions.length > 0 ? (
                        sessions.map((user: User) => (
                            <tr
                                key={user.id}
                                className="hover:bg-primary/5 transition-all duration-300 group active:bg-primary/10"
                            >
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar
                                                src={user.avatar_url || undefined}
                                                name={user.full_name || user.username}
                                                size="md"
                                                status="online"
                                                className="group-hover:scale-105 transition-transform duration-500 shadow-sm ring-4 ring-transparent group-hover:ring-primary/10"
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-black text-foreground text-sm truncate group-hover:text-primary transition-colors tracking-tight">
                                                {user.full_name || user.username}
                                            </div>
                                            <div className="text-[10px] font-bold text-primary opacity-60 uppercase tracking-widest">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 shadow-sm">
                                        {user.unit_name || user.unit?.name || t('admin.noUnit')}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="flex items-center gap-2 text-xs font-bold text-foreground opacity-80 tabular-nums uppercase tracking-widest">
                                        <Clock size={14} className="text-primary" strokeWidth={2.5} />
                                        {formatDuration(new Date(user.session_start || user.last_seen || new Date()), t)}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="px-4 py-2 bg-destructive/5 text-destructive text-[9px] font-black uppercase tracking-widest rounded-xl border border-destructive/10 hover:bg-destructive hover:text-white transition-all active:scale-95 shadow-sm">
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-8 py-20 text-center animate-scale-in">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center shadow-inner">
                                        <Activity size={48} className="text-muted-foreground/20" strokeWidth={1} />
                                    </div>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
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
