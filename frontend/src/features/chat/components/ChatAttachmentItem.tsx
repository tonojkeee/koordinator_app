import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileX, Download, Eye
} from 'lucide-react';
import type { ContextMenuItem } from '../../../types';
import { useContextMenu } from '../../../hooks/useContextMenu';
import api from '../../../api/client';
import { useConfigStore } from '../../../store/useConfigStore';

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
            <div className="mt-2 w-full max-w-sm group/attach select-none">
                <div className={`flex items-center space-x-3 p-3 rounded-md border transition-all duration-200 ${isSent
                    ? 'bg-black/5 border-white/10'
                    : 'bg-[#F0F0F0] border-[#E0E0E0]'
                    }`}>
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${isSent ? 'bg-white/20 text-white' : 'bg-white text-[#616161]'
                        }`}>
                        <FileX size={20} className="opacity-60" />
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                        <h4 className={`text-[13px] font-semibold ${isSent ? 'text-white' : 'text-[#242424]'}`}>
                            {t('chat.document_deleted')}
                        </h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSent ? 'text-white/60' : 'text-[#616161]'}`}>
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
                className={`mt-2 ${isSent ? 'ml-auto' : ''} w-full max-w-sm group/attach cursor-pointer`}
            >
                <div className={`rounded-md overflow-hidden transition-all duration-200 border border-transparent hover:border-[#E0E0E0]`}>
                    <img
                        src={imageUrl}
                        alt={msg.document_title || 'Image'}
                        className="w-full h-auto max-h-48 object-cover"
                        loading="lazy"
                    />
                    <div className={`px-3 py-2 flex items-center justify-between ${isSent
                        ? 'bg-black/5 backdrop-blur-sm'
                        : 'bg-[#F5F5F5]'
                        }`}>
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-[12px] font-semibold truncate ${isSent ? 'text-white' : 'text-[#242424]'}`}>
                                {msg.document_title || t('chat.fileNotification.document')}
                            </h4>
                        </div>
                        <div className="flex items-center space-x-1 ml-2 shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-all ${isSent
                                    ? 'text-white hover:bg-white/20'
                                    : 'text-[#616161] hover:bg-[#E0E0E0] hover:text-[#242424]'
                                    }`}
                                title={t('chat.fileNotification.download')}
                            >
                                <Download size={16} strokeWidth={1.5} />
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
            className={`mt-2 ${isSent ? 'ml-auto' : ''} w-full max-w-sm group/attach cursor-pointer`}
        >
            <div className={`flex items-center space-x-3 p-3 rounded-md border transition-all duration-200 ${isSent
                ? 'bg-white/10 border-white/10 hover:bg-white/20'
                : 'bg-white border-[#E0E0E0] hover:border-[#5B5FC7]/30 hover:bg-[#F5F5F5]'
                }`}>
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${isSent ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-[#5B5FC7]'
                    }`}>
                    {config.icon}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                    <h4 className={`text-[13px] font-semibold truncate transition-colors ${isSent ? 'text-white' : 'text-[#242424] group-hover/attach:text-[#5B5FC7]'
                        }`}>
                        {msg.document_title || t('chat.fileNotification.document')}
                    </h4>
                    <div className="flex items-center space-x-2 mt-0.5">
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${isSent ? 'text-white/70' : 'text-[#616161]'}`}>
                            {fileExt}
                        </span>
                        <span className={`w-0.5 h-0.5 rounded-full ${isSent ? 'bg-white/50' : 'bg-[#888888]'}`} />
                        <span className={`text-[10px] font-medium uppercase tracking-tight truncate max-w-[100px] ${isSent ? 'text-white/70' : 'text-[#888888]'}`}>
                            {config.label}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover/attach:opacity-100 transition-opacity">
                    <button
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onView(); }}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${isSent
                            ? 'bg-white/10 text-white hover:bg-white/25 active:scale-95'
                            : 'bg-[#F0F0F0] text-[#616161] hover:bg-[#E0E0E0] hover:text-[#5B5FC7] active:scale-95'
                            }`}
                        title={t('chat.fileNotification.view')}
                    >
                        <Eye size={16} strokeWidth={1.5} />
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
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${isSent
                            ? 'bg-white/10 text-white hover:bg-white/25 active:scale-95'
                            : 'bg-[#F0F0F0] text-[#616161] hover:bg-[#E0E0E0] hover:text-[#242424] active:scale-95'
                            }`}
                        title={t('chat.fileNotification.download')}
                    >
                        <Download size={16} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
