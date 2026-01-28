import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileX, Download, Eye
} from 'lucide-react';
import type { ContextMenuItem } from '../../../types';
import { useContextMenu } from '../../../hooks/useContextMenu';
import api from '../../../api/client';
import { useConfigStore } from '../../../store/useConfigStore';
import { cn } from '../../../design-system';

const getFullUrlLocal = (path: string, token: string | null): string => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const { serverUrl } = useConfigStore.getState();
    const baseUrl = (serverUrl || import.meta.env.VITE_API_URL || api.defaults.baseURL || '').replace(/\/api$/, '');
    const finalPath = path.startsWith('/api') ? path : path.startsWith('/board') ? `/api${path}` : path;
    return `${baseUrl}${finalPath}${token ? (finalPath.includes('?') ? `&token=${token}` : `?token=${token}`) : ''}`;
};

 interface ChatAttachmentItemProps {
    msg: import('../../../types').Message;
    isSent: boolean;
    onView: () => void;
    onDownload: () => void;
    getFileConfig: (filename: string) => { icon: React.ReactNode; color: string; label: string };
    token: string | null;
}

export const ChatAttachmentItem: React.FC<ChatAttachmentItemProps> = ({
    msg,
    isSent,
    onView,
    onDownload,
    getFileConfig,
    token
}) => {
    const { t } = useTranslation();
    const config = getFileConfig(msg.file_path || '');
    const fileExt = (msg.file_path?.split('.').pop() || 'file').toUpperCase();
    const isDeleted = msg.is_document_deleted;

    const menuItems: ContextMenuItem[] = isDeleted ? [] : [
        { id: 'view', label: t('common.view') },
        { id: 'download', label: t('common.download') },
    ];

    const handleContextMenu = useContextMenu(menuItems, (id) => {
        if (id === 'view') onView();
        if (id === 'download') onDownload();
    });

    const isElectron = window.electron !== undefined;

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const isImage = msg.file_path && imageExtensions.includes(fileExt.toLowerCase());
    const imageUrl = isImage ? getFullUrlLocal(`/board/documents/${msg.document_id}/view`, token) : null;

    if (isDeleted) {
        return (
            <div className="mt-2.5 w-full max-w-sm group/attach select-none animate-fade-in">
                <div className={cn(
                    "flex items-center space-x-4 p-3.5 rounded-2xl border transition-all duration-300",
                    isSent
                        ? 'bg-white/5 border-white/10 shadow-inner'
                        : 'bg-surface-3 border-border shadow-inner opacity-70'
                )}>
                    <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                        isSent ? 'bg-white/10 text-white' : 'bg-surface text-muted-foreground'
                    )}>
                        <FileX size={22} className="opacity-40" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className={cn(
                            "text-sm font-black tracking-tight",
                            isSent ? 'text-white' : 'text-foreground'
                        )}>
                            {t('chat.document_deleted')}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.15em] opacity-60",
                                isSent ? 'text-white' : 'text-muted-foreground'
                            )}>
                                {t('common.unavailable')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isImage && imageUrl) {
        return (
            <div
                onClick={onView}
                onContextMenu={handleContextMenu}
                className={cn(
                    "mt-2.5 w-full max-w-[340px] group/attach cursor-pointer animate-scale-in",
                    isSent ? 'ml-auto' : ''
                )}
            >
                <div className="rounded-2xl overflow-hidden transition-all duration-500 border border-border shadow-m3-1 group-hover/attach:shadow-teams-card group-hover/attach:border-primary/20 relative">
                    <img
                        src={imageUrl}
                        alt={msg.document_title || 'Image'}
                        className="w-full h-auto max-h-56 object-cover transition-transform duration-700 group-hover/attach:scale-105"
                        loading="lazy"
                    />
                    <div className={cn(
                        "px-4 py-3 flex items-center justify-between border-t border-border/50",
                        isSent
                            ? 'bg-black/20 backdrop-blur-md'
                            : 'bg-surface/90 backdrop-blur-md'
                    )}>
                        <div className="flex-1 min-w-0">
                            <h4 className={cn(
                                "text-xs font-black truncate tracking-tight",
                                isSent ? 'text-white' : 'text-foreground'
                            )}>
                                {msg.document_title || t('chat.fileNotification.document')}
                            </h4>
                        </div>
                        <div className="flex items-center space-x-2 ml-3 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-sm",
                                    isSent
                                        ? 'bg-white/10 text-white hover:bg-white/20'
                                        : 'bg-surface border border-border text-muted-foreground hover:text-primary hover:border-primary/30'
                                )}
                                title={t('chat.fileNotification.download')}
                            >
                                <Download size={16} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={isElectron ? onDownload : onView}
            onContextMenu={handleContextMenu}
            className={cn(
                "mt-2.5 w-full max-w-sm group/attach cursor-pointer animate-slide-up",
                isSent ? 'ml-auto' : ''
            )}
        >
            <div className={cn(
                "flex items-center space-x-4 p-3.5 rounded-2xl border transition-all duration-500 relative overflow-hidden group/card",
                isSent
                    ? 'bg-white/10 border-white/10 hover:bg-white/15 shadow-m3-1'
                    : 'bg-surface border-border hover:border-primary/30 hover:shadow-teams-card'
            )}>
                {/* Visual accent */}
                {!isSent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover/attach:opacity-100 transition-opacity" />}

                <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-500 group-hover/attach:scale-110",
                    isSent ? 'bg-white/20 text-white' : 'bg-surface-3 text-primary border border-border/50'
                )}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {React.cloneElement(config.icon as React.ReactElement<any>, { size: 22, strokeWidth: 2 } as any)}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                    <h4 className={cn(
                        "text-[13px] font-black truncate tracking-tight transition-colors",
                        isSent ? 'text-white' : 'text-foreground group-hover/attach:text-primary'
                    )}>
                        {msg.document_title || t('chat.fileNotification.document')}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={cn(
                            "text-[9px] font-black tracking-[0.1em] uppercase opacity-70",
                            isSent ? 'text-white' : 'text-muted-foreground'
                        )}>
                            {fileExt}
                        </span>
                        <span className={cn("w-1 h-1 rounded-full opacity-30", isSent ? 'bg-white' : 'bg-muted-foreground')} />
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px] opacity-70",
                            isSent ? 'text-white' : 'text-muted-foreground'
                        )}>
                            {config.label}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 opacity-0 group-hover/attach:opacity-100 transition-all translate-x-2 group-hover/attach:translate-x-0">
                    <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(); }}
                        className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90",
                            isSent
                                ? 'bg-white/10 text-white hover:bg-white/25'
                                : 'bg-surface border border-border text-muted-foreground hover:text-primary hover:border-primary/30'
                        )}
                        title={t('chat.fileNotification.view')}
                    >
                        <Eye size={18} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            const url = getFullUrlLocal(`/board/documents/${msg.document_id}/download`, token);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', msg.document_title || 'download');
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-90",
                            isSent
                                ? 'bg-white/10 text-white hover:bg-white/25'
                                : 'bg-surface border border-border text-muted-foreground hover:text-primary hover:border-primary/30'
                        )}
                        title={t('chat.fileNotification.download')}
                    >
                        <Download size={18} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
