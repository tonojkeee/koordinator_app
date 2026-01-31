/**
 * LogsModal Component
 * Audit logs viewer modal
 */

import React from 'react';
import { Activity, X } from 'lucide-react';

import { Modal, Avatar, cn } from '../../../../design-system';
import { useAuditLogs } from '../../hooks/useAdminQueries';
import { formatActivityDate } from '../../utils';
import type { LogsModalProps } from '../../types';

export const LogsModal: React.FC<LogsModalProps> = ({ onClose, t }) => {
    const { data: logs, isLoading } = useAuditLogs();

    return (
        <Modal isOpen={true} onClose={onClose} size="lg" title="">
            <div className="flex flex-col max-h-[85vh] animate-fade-in">
                {/* Header */}
                <div
                    className="border-b border-border flex items-center gap-5 bg-surface-1/50"
                    style={{ padding: 'var(--spacing-lg)' }}
                >
                    <div
                        className="p-4 bg-primary rounded-lg text-white transition-transform duration-500"
                        style={{
                            borderRadius: 'var(--radius)',
                            boxShadow: 'var(--shadow-medium)',
                            transitionDuration: 'var(--duration-normal)',
                            transitionTimingFunction: 'var(--easing-spring)'
                        }}
                    >
                        <Activity size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{t('admin.systemStatus.logs')}</h2>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">{t('admin.auditLog')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 rounded-xl"
                        style={{
                            borderRadius: 'var(--radius)',
                            transitionDuration: 'var(--duration-fast)',
                            transitionTimingFunction: 'var(--easing-out)'
                        }}
                    >
                        <X size={24} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto custom-scrollbar bg-surface"
                    style={{ padding: 'var(--spacing-md)' }}
                >
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
                                <div className="w-12 h-12 rounded-full border-4 border-surface-3 border-t-primary animate-spin shadow-sm" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t('common.loading')}</span>
                            </div>
                        ) : logs && logs.length > 0 ? (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="bg-surface p-5 border border-border shadow-sm flex gap-5 group hover:border-primary/20 active:scale-[0.99] animate-slide-up"
                                    style={{
                                        borderRadius: 'var(--radius)',
                                        boxShadow: 'var(--shadow-subtle)',
                                        transitionDuration: 'var(--duration-normal)',
                                        transitionTimingFunction: 'var(--easing-out)'
                                    }}
                                >
                                    <Avatar
                                        src={log.user.avatar_url}
                                        name={log.user.full_name || log.user.username}
                                        size="md"
                                        className="group-hover:scale-105 transition-transform duration-500 shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                                                    {log.user.full_name || log.user.username}
                                                </span>
                                                <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">
                                                    @{log.user.username}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-black text-muted-foreground/50 bg-surface-2 px-3 py-1.5 rounded-full border border-border/50 tabular-nums uppercase tracking-widest">
                                                {formatActivityDate(log.timestamp, t)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full shadow-sm border",
                                                log.action.includes('delete')
                                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                    : log.action.includes('create')
                                                        ? 'bg-green-500/10 text-green-700 border-green-500/20'
                                                        : 'bg-primary/10 text-primary border-primary/20'
                                            )}>
                                                {t(`admin.auditLogActions.${log.action}`, log.action)}
                                            </span>
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest bg-surface-2 px-3 py-1 rounded-full border border-border/50 opacity-70">
                                                {t(`admin.auditLogTargets.${log.target_type}`, log.target_type)}
                                                {log.target_id ? ` #${log.target_id}` : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-foreground font-bold bg-surface-2/50 p-4 rounded-xl border border-border/40 leading-relaxed shadow-inner group-hover:bg-surface-2 transition-colors">
                                            {log.details}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-24 animate-scale-in">
                                <div
                                    className="w-20 h-20 bg-surface-2 flex items-center justify-center mx-auto mb-6"
                                    style={{ borderRadius: '100%', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}
                                >
                                    <Activity size={40} className="text-muted-foreground/20" strokeWidth={1} />
                                </div>
                                <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] opacity-60">{t('common.nothing_found')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default LogsModal;
