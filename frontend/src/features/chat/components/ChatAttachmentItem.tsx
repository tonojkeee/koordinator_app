import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileX, Download
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
            <div className="mt-1 w-full max-w-sm group/attach select-none animate-fade-in">
                <div className={cn(
                    "flex items-center space-x-4 p-3 rounded-xl border transition-all duration-300",
                    isSent
                        ? 'bg-cyan-600 border-cyan-400/30 text-white'
                        : 'bg-white border-slate-200 text-slate-500'
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isSent ? 'bg-white/10' : 'bg-slate-100'
                    )}>
                        <FileX size={20} className="opacity-60" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className="text-sm font-medium tracking-tight">
                            {t('chat.document_deleted')}
                        </h4>
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
                    "mt-1 w-full max-w-[320px] group/attach cursor-pointer animate-scale-in",
                    isSent ? 'ml-auto' : ''
                )}
            >
                <div className={cn(
                    "rounded-xl overflow-hidden transition-all duration-300 border relative shadow-sm",
                    isSent ? "border-cyan-400/30" : "border-slate-200",
                    "group-hover/attach:shadow-md"
                )}>
                    <img
                        src={imageUrl}
                        alt={msg.document_title || 'Image'}
                        className="w-full h-auto max-h-60 object-cover transition-transform duration-500 group-hover/attach:scale-105"
                        loading="lazy"
                    />
                    <div className={cn(
                        "absolute inset-x-0 bottom-0 px-3 py-2 flex items-center justify-between backdrop-blur-md transition-opacity duration-200",
                        isSent
                            ? 'bg-black/40 text-white'
                            : 'bg-white/90 text-slate-800 border-t border-slate-100',
                        "opacity-0 group-hover/attach:opacity-100"
                    )}>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium truncate">
                                {msg.document_title || t('chat.fileNotification.document')}
                            </h4>
                        </div>
                        <div className="flex items-center space-x-1 ml-2 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                className={cn(
                                    "p-1.5 rounded-md transition-colors",
                                    isSent
                                        ? 'hover:bg-white/20'
                                        : 'hover:bg-slate-100'
                                )}
                                title={t('chat.fileNotification.download')}
                            >
                                <Download size={14} strokeWidth={2.5} />
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
                "mt-1 w-full max-w-sm group/attach cursor-pointer animate-slide-up",
                isSent ? 'ml-auto' : ''
            )}
        >
            <div className={cn(
                "flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 relative overflow-hidden group/card shadow-sm",
                isSent
                    ? 'bg-cyan-600 border-cyan-500 hover:bg-cyan-700 text-white'
                    : 'bg-white border-slate-200 hover:border-cyan-200 hover:shadow-md text-slate-800'
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover/attach:scale-105",
                    isSent ? 'bg-white/20 text-white' : 'bg-slate-50 border border-slate-100'
                )}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {React.cloneElement(config.icon as React.ReactElement<any>, { size: 20, strokeWidth: 2 } as any)}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                    <h4 className={cn(
                        "text-[13px] font-semibold truncate tracking-tight transition-colors",
                        isSent ? 'text-white' : 'text-slate-800 group-hover/attach:text-cyan-600'
                    )}>
                        {msg.document_title || t('chat.fileNotification.document')}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <span className={cn(
                            "text-[10px] font-bold tracking-wider uppercase opacity-70",
                            isSent ? 'text-cyan-100' : 'text-slate-500'
                        )}>
                            {fileExt}
                        </span>
                        <span className={cn("w-0.5 h-0.5 rounded-full opacity-40", isSent ? 'bg-white' : 'bg-slate-400')} />
                        <span className={cn(
                            "text-[10px] font-medium uppercase tracking-wider truncate max-w-[120px] opacity-70",
                            isSent ? 'text-cyan-100' : 'text-slate-500'
                        )}>
                            {config.label}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover/attach:opacity-100 transition-all translate-x-2 group-hover/attach:translate-x-0">
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
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90",
                            isSent
                                ? 'hover:bg-white/20 text-white'
                                : 'hover:bg-slate-100 text-slate-500 hover:text-cyan-600'
                        )}
                        title={t('chat.fileNotification.download')}
                    >
                        <Download size={16} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
