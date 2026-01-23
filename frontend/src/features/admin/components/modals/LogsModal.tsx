/**
 * LogsModal Component
 * Audit logs viewer modal
 */

import React from 'react';
import { Activity } from 'lucide-react';

import { Modal, Avatar } from '../../../../design-system';
import { useAuditLogs } from '../../hooks/useAdminQueries';
import { formatActivityDate } from '../../utils';
import type { LogsModalProps } from '../../types';

export const LogsModal: React.FC<LogsModalProps> = ({ onClose, t }) => {
    const { data: logs, isLoading } = useAuditLogs();

    return (
        <Modal isOpen={true} onClose={onClose} size="lg" title="">
            <div className="flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-xl text-white">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{t('admin.systemStatus.logs')}</h2>
                        <p className="text-sm text-slate-400">{t('admin.auditLog')}</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin" />
                                <span className="text-slate-400 font-semibold text-sm">{t('common.loading')}</span>
                            </div>
                        ) : logs && logs.length > 0 ? (
                            logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="bg-white p-4 rounded-xl border border-slate-100 flex gap-4 hover:shadow-md transition-all group"
                                >
                                    <Avatar
                                        src={log.user.avatar_url}
                                        name={log.user.full_name || log.user.username}
                                        size="md"
                                        className="group-hover:scale-105 transition-transform"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-semibold text-slate-900">
                                                {log.user.full_name || log.user.username}
                                            </span>
                                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                {formatActivityDate(log.timestamp, t)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${log.action.includes('delete')
                                                    ? 'bg-rose-500 text-white'
                                                    : log.action.includes('create')
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-indigo-600 text-white'
                                                }`}>
                                                {t(`admin.auditLogActions.${log.action}`, log.action)}
                                            </span>
                                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                                {t(`admin.auditLogTargets.${log.target_type}`, log.target_type)}
                                                {log.target_id ? ` #${log.target_id}` : ''}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                            {log.details}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <Activity size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-semibold">{t('common.nothing_found')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default LogsModal;
