import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Trash2, User, Calendar, Eye, MessageSquare, ExternalLink, FileSpreadsheet, FileImage, FileCode, Archive } from 'lucide-react';
import type { Document, DocumentShare } from '../types';
import { useDeleteDocument } from '../boardApi';
import { useTranslation } from 'react-i18next';
import { useDocumentViewer } from '../store/useDocumentViewer';
import { useAuthStore } from '../../../store/useAuthStore';
import { useConfigStore } from '../../../store/useConfigStore';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/client';
import { ContextMenu, type ContextMenuOption, Button } from '../../../design-system';

interface DocumentListProps {
    documents?: Document[];
    shares?: DocumentShare[];
    type: 'owned' | 'received';
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, shares, type }) => {
    const { t } = useTranslation();
    const { token } = useAuthStore();
    const { mutate: deleteDoc } = useDeleteDocument();
    const openViewer = useDocumentViewer(state => state.open);
    const [hoveredDocId, setHoveredDocId] = useState<number | null>(null);

    const getFullUrl = (path: string, isApi = false) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = (import.meta.env.VITE_API_URL || api.defaults.baseURL || '').replace('/api', '');
        const finalPath = isApi ? `/api${path}` : path;
        return `${baseUrl}${finalPath}`;
    };

    const handleDelete = useCallback((id: number) => {
        if (window.confirm(t('board.list.delete_confirm'))) {
            deleteDoc(id);
        }
    }, [deleteDoc, t]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' && hoveredDocId && type === 'owned') {
                handleDelete(hoveredDocId);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hoveredDocId, type, handleDelete]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in">
            {type === 'owned' ? (
                documents?.map((doc) => (
                    <DocumentListItem
                        key={doc.id}
                        doc={doc}
                        type="owned"
                        onView={() => openViewer(getFullUrl(`/board/documents/${doc.id}/view?token=${token}`, true), doc.title, doc.file_path)}
                        onDownload={() => {
                            const url = getFullUrl(`/board/documents/${doc.id}/download?token=${token}`, true);
                            window.location.href = url;
                        }}
                        onDelete={() => handleDelete(doc.id)}
                        onMouseEnter={() => setHoveredDocId(doc.id)}
                        onMouseLeave={() => setHoveredDocId(null)}
                    />
                ))
            ) : (
                shares?.map((share) => (
                    <DocumentListItem
                        key={share.id}
                        doc={share.document}
                        share={share}
                        type="received"
                        onView={() => openViewer(getFullUrl(`/board/documents/${share.document.id}/view?token=${token}`, true), share.document.title, share.document.file_path)}
                        onDownload={() => {
                            const url = getFullUrl(`/board/documents/${share.document.id}/download?token=${token}`, true);
                            window.location.href = url;
                        }}
                        onMouseEnter={() => setHoveredDocId(share.document.id)}
                        onMouseLeave={() => setHoveredDocId(null)}
                    />
                ))
            )}
        </div>
    );
};

interface ChannelInfoProps {
    share?: DocumentShare;
    docId: number;
}

const ChannelInfo: React.FC<ChannelInfoProps> = ({ share, docId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!share?.channels || share.channels.length === 0) return null;

    return (
        <div className="flex flex-col gap-1 mt-1">
            {share.channels.map(c => (
                <button
                    key={c.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/chat/${c.id}?docId=${docId}`);
                    }}
                    className="flex items-center text-[10px] text-tertiary font-medium hover:text-primary transition-colors duration-[var(--duration-fast)] ease-[var(--easing-out)] group text-left"
                >
                    <MessageSquare size={10} className="mr-1 opacity-50 group-hover:opacity-100 transition-opacity duration-[var(--duration-fast)] ease-[var(--easing-out)]" />
                    <span className="opacity-70 mr-1">{t('board.list.in_chat')}:</span>
                    <span className="text-primary truncate max-w-[150px] underline decoration-dotted">{c.name}</span>
                </button>
            ))}
        </div>
    );
};

interface DocumentListItemProps {
    doc: Document;
    type: 'owned' | 'received';
    onView: () => void;
    onDownload: () => void;
    onDelete?: () => void;
    share?: DocumentShare;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const DocumentListItem: React.FC<DocumentListItemProps> = ({
    doc,
    type,
    onView,
    onDownload,
    onDelete,
    share,
    onMouseEnter,
    onMouseLeave
}) => {
    const { t } = useTranslation();
    const { token } = useAuthStore();
    const isElectron = window.electron !== undefined;
    const { serverUrl } = useConfigStore();

    const getFullUrl = (path: string, isApi = false) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = (serverUrl || import.meta.env.VITE_API_URL || api.defaults.baseURL || '').replace(/\/api$/, '');
        const finalPath = isApi ? `/api${path}` : path;
        return `${baseUrl}${finalPath}`;
    };

    const contextOptions: ContextMenuOption[] = [
        { label: t('board.list.view'), icon: Eye, onClick: onView },
        { label: t('board.list.download'), icon: Download, onClick: onDownload },
    ];

    if (isElectron) {
        contextOptions.push({ 
            label: t('board.copy_path'), 
            icon: ExternalLink, 
            onClick: () => window.electron?.copyToClipboard(doc.file_path) 
        });
    }

    if (type === 'owned') {
        contextOptions.push({ 
            label: t('board.list.delete'), 
            icon: Trash2, 
            variant: 'danger', 
            onClick: () => onDelete?.(),
            divider: true
        });
    }

    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].some(ext => doc.file_path.toLowerCase().endsWith(`.${ext}`));
    const viewUrl = getFullUrl(`/board/documents/${doc.id}/view?token=${token}`, true);

    // Get file extension for icon selection
    const getFileIcon = () => {
        const ext = doc.file_path.split('.').pop()?.toLowerCase() || '';
        // PDF files
        if (ext === 'pdf') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(0_84%_97%)] dark:bg-[hsl(0_84%_10%)]">
                    <FileText size={48} strokeWidth={1} className="text-[hsl(0_84%_60%)] dark:text-[hsl(0_84%_65%)]" />
                </div>
            );
        }
        // Word documents
        if (['doc', 'docx'].includes(ext)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(210_95%_97%)] dark:bg-[hsl(210_95%_10%)]">
                    <FileText size={48} strokeWidth={1} className="text-[hsl(210_95%_42%)] dark:text-[hsl(210_95%_60%)]" />
                </div>
            );
        }
        // Excel spreadsheets
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(142_76%_97%)] dark:bg-[hsl(142_76%_10%)]">
                    <FileSpreadsheet size={48} strokeWidth={1} className="text-[hsl(142_76%_36%)] dark:text-[hsl(142_76%_55%)]" />
                </div>
            );
        }
        // PowerPoint presentations
        if (['ppt', 'pptx'].includes(ext)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(38_92%_97%)] dark:bg-[hsl(38_92%_10%)]">
                    <FileText size={48} strokeWidth={1} className="text-[hsl(38_92%_50%)] dark:text-[hsl(38_92%_60%)]" />
                </div>
            );
        }
        // Archives
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(45_93%_97%)] dark:bg-[hsl(45_93%_10%)]">
                    <Archive size={48} strokeWidth={1} className="text-[hsl(45_93%_50%)] dark:text-[hsl(45_93%_60%)]" />
                </div>
            );
        }
        // Code files
        if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb', 'swift', 'kt'].includes(ext)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(262_83%_97%)] dark:bg-[hsl(262_83%_10%)]">
                    <FileCode size={48} strokeWidth={1} className="text-[hsl(262_83%_58%)] dark:text-[hsl(262_83%_65%)]" />
                </div>
            );
        }
        // Images
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-[hsl(280_67%_97%)] dark:bg-[hsl(280_67%_10%)]">
                    <FileImage size={48} strokeWidth={1} className="text-[hsl(280_67%_60%)] dark:text-[hsl(280_67%_65%)]" />
                </div>
            );
        }
        // Default icon
        return (
            <div className="w-full h-full flex items-center justify-center group-hover:bg-primary/5 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)]">
                <FileText size={48} strokeWidth={1} className="text-tertiary/30 group-hover:text-primary transition-colors duration-[var(--duration-normal)] ease-[var(--easing-out)]" />
            </div>
        );
    };

    return (
        <ContextMenu options={contextOptions} className="h-full">
            <div
                onClick={isElectron ? onDownload : onView}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className="group bg-card p-4 rounded-[var(--radius)] border border-border shadow-subtle hover:shadow-medium hover:-translate-y-0.5 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] cursor-pointer flex flex-col h-full relative overflow-hidden"
                style={{ borderRadius: 'var(--radius)' }}
            >
                <div
                    className="relative mb-4 rounded-[var(--radius)] overflow-hidden aspect-[16/10] bg-surface-2 border border-border group-hover:border-primary/30 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)]"
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    {isImage ? (
                        <img
                            src={viewUrl}
                            alt={doc.title}
                            className="w-full h-full object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--easing-spring)] group-hover:scale-105"
                            onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement?.classList.add('flex', 'items-center', 'justify-center');
                            }}
                        />
                    ) : getFileIcon()}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0_0%_0%)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--duration-normal)] ease-[var(--easing-out)]" />
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-start justify-between mb-3">
                        <h3
                            className="text-sm font-black text-secondary leading-snug line-clamp-2 tracking-tight group-hover:text-primary transition-colors duration-[var(--duration-normal)] ease-[var(--easing-out)]"
                            title={doc.title}
                        >{doc.title}</h3>
                        {type === 'owned' && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                className="p-1.5 text-[hsl(220_12%_47%)] hover:text-[hsl(0_84%_60%)] hover:bg-[hsl(0_84%_60%)]/10 rounded-[var(--radius)] transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] shrink-0 ml-2 opacity-0 group-hover:opacity-100"
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                <Trash2 size={14} strokeWidth={2} />
                            </button>
                        )}
                    </div>

                    {type === 'received' && (
                        <div className="mt-auto pt-3 border-t border-border/60 space-y-2">
                            <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center text-tertiary font-bold">
                                    <User size={12} className="mr-1.5 opacity-50" strokeWidth={2.5} />
                                    <span className="text-secondary tracking-tight">{doc.owner?.full_name || doc.owner?.username}</span>
                                </div>
                                <span className="text-tertiary font-black opacity-70 uppercase tracking-widest">{share && new Date(share.created_at).toLocaleDateString()}</span>
                            </div>
                            <ChannelInfo share={share} docId={doc.id} />
                        </div>
                    )}

                    {type === 'owned' && (
                        <div className="mt-auto pt-3 flex items-center text-[10px] text-tertiary font-black uppercase tracking-widest opacity-70">
                            <Calendar size={12} className="mr-2" strokeWidth={3} />
                            {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex space-x-2">
                    <Button
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        variant="primary"
                        size="sm"
                        className="flex-1 font-black uppercase tracking-widest text-[10px] shadow-subtle hover:shadow-medium hover:translate-y-[-0.5px] active:shadow-subtle active:translate-y-[0.5px] transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] h-9"
                        icon={<Eye size={14} strokeWidth={3} />}
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        {t('board.list.view')}
                    </Button>
                    <Button
                        onClick={(e) => { e.stopPropagation(); onDownload(); }}
                        variant="secondary"
                        size="sm"
                        className="w-9 h-9 p-0 border-border shadow-subtle hover:shadow-medium hover:translate-y-[-0.5px] active:shadow-subtle active:translate-y-[0.5px] transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)]"
                        icon={<Download size={14} strokeWidth={3} />}
                        style={{ borderRadius: 'var(--radius)' }}
                    />
                </div>
            </div>
        </ContextMenu>
    );
};

export default DocumentList;
