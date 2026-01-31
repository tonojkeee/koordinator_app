import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Folder as FolderIcon,
    Trash2,
    Clock,
    User as UserIcon
} from 'lucide-react';
import type { ContextMenuItem } from '../../../types';
import { useContextMenu } from '../../../hooks/useContextMenu';
import type { ArchiveFolder, ArchiveFile } from '../types';
import { formatDate, formatSize } from '../utils';
import api from '../../../api/client';
import { useAuthStore } from '../../../store/useAuthStore';
import { useConfigStore } from '../../../store/useConfigStore';

import { cn } from '../../../design-system';

interface ArchiveFolderCardProps {
    folder: ArchiveFolder;
    index: number;
    isSelected: boolean;
    selectionCount: number;
    onNavigate: (folder: ArchiveFolder) => void;
    onClick: (e: React.MouseEvent, index: number) => void;
    onDelete: (folder: ArchiveFolder) => void;
    onCopy: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onCut: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onPaste: () => void;
    clipboard: { action: 'copy' | 'cut'; items: { id: number; type: 'file' | 'folder' }[] } | null;
    selectedItems: { id: number; type: 'file' | 'folder' }[];
    currentUserId: number | undefined;
    userRole: string | undefined;
    userUnitId: number | null | undefined;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onRename?: (item: { id: number; type: 'file' | 'folder'; name: string }) => void;
    onProperties?: (item: ArchiveFolder | ArchiveFile) => void;
}

export const ArchiveFolderCard: React.FC<ArchiveFolderCardProps> = ({
    folder,
    index,
    isSelected,
    selectionCount,
    onNavigate,
    onClick,
    onDelete,
    onCopy,
    onCut,
    onPaste,
    clipboard,
    selectedItems,
    currentUserId,
    userRole,
    userUnitId,
    onMouseEnter,
    onMouseLeave,
    onRename,
    onProperties
}) => {
    const { t } = useTranslation();
    const canDelete = userRole === 'admin' || (userUnitId != null && userUnitId === folder.unit_id) || currentUserId === folder.owner_id;

    const menuItems: ContextMenuItem[] = [
        { id: 'open', label: t('archive.open') },
        { id: 'sep1', type: 'separator', label: '' } as ContextMenuItem,
        { id: 'cut', label: (isSelected && selectionCount > 1) ? t('archive.cut_items', { count: selectionCount }) : t('archive.cut_action') },
        { id: 'copy', label: (isSelected && selectionCount > 1) ? t('archive.copy_items', { count: selectionCount }) : t('archive.copy') },
        ...(clipboard ? [{ id: 'paste', label: t('archive.paste_items', { count: clipboard.items.length }) }] : []),
        { id: 'sep2', type: 'separator', label: '' } as ContextMenuItem,
        { id: 'rename', label: t('archive.rename'), enabled: selectionCount <= 1 },
        { id: 'delete', label: (isSelected && selectionCount > 1) ? t('archive.delete_items', { count: selectionCount }) : t('archive.delete') },
        { id: 'sep3', type: 'separator', label: '' } as ContextMenuItem,
        { id: 'properties', label: t('archive.properties'), enabled: selectionCount <= 1 }
    ].filter(item => {
        if (item.id === 'delete') return canDelete;
        return true;
    });

    const handleContextMenu = useContextMenu(menuItems, (id) => {
        if (id === 'open') onNavigate(folder);
        if (id === 'copy') onCopy(isSelected && selectionCount > 1 ? selectedItems : [{ id: folder.id, type: 'folder' }]);
        if (id === 'cut') onCut(isSelected && selectionCount > 1 ? selectedItems : [{ id: folder.id, type: 'folder' }]);
        if (id === 'paste') onPaste();
        if (id === 'delete') onDelete(folder);
        if (id === 'rename' && onRename) onRename({ id: folder.id, type: 'folder', name: folder.name });
        if (id === 'properties' && onProperties) onProperties(folder);
    });

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick(e, index)}
            onDoubleClick={(e) => { e.stopPropagation(); onNavigate(folder); }}
            onContextMenu={handleContextMenu}
            className={cn(
                "group rounded-lg border p-5 transition-all duration-[var(--duration-slow)] cursor-pointer relative flex flex-col justify-between min-h-[140px] animate-slide-up active:scale-[0.98]",
                isSelected
                    ? 'bg-primary/5 border-primary shadow-subtle ring-2 ring-primary/5'
                    : 'bg-surface border-border hover:shadow-medium hover:border-primary/20 hover:bg-surface-2 hover:-translate-y-0.5'
            )}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            {canDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-danger/5 text-danger hover:bg-danger hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-[var(--duration-normal)] z-10 flex items-center justify-center shadow-sm"
                    title={t('archive.delete')}
                >
                    <Trash2 size={14} strokeWidth={2.5} />
                </button>
            )}
            <div>
                <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 bg-warning/10 rounded-lg flex items-center justify-center text-warning shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-[var(--duration-slow)]">
                        <FolderIcon size={28} strokeWidth={2} fill="currentColor" fillOpacity={0.2} />
                    </div>
                </div>
                <h3 className={cn(
                    "font-black text-secondary truncate pr-6 tracking-tight leading-none transition-colors duration-[var(--duration-fast)]",
                    isSelected ? "text-primary" : "group-hover:text-primary"
                )} title={folder.name}>
                    {folder.name}
                </h3>
            </div>
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-tertiary mt-5 pt-4 border-t border-border/40">
                <div className="flex items-center space-x-1.5">
                    <UserIcon size={10} strokeWidth={3} />
                    <span className="truncate max-w-[90px]">{folder.owner_name}</span>
                </div>
                <div className="flex items-center space-x-1.5 tabular-nums">
                    <Clock size={10} strokeWidth={3} />
                    <span>{formatDate(folder.created_at, t)}</span>
                </div>
            </div>
            {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
        </div>
    );
};

interface ArchiveFileCardProps {
    file: ArchiveFile;
    index: number;
    isSelected: boolean;
    selectionCount: number;
    onView: () => void;
    onDownload: () => void;
    onOpenNative?: () => void;
    onClick: (e: React.MouseEvent, index: number) => void;
    onDelete: (file: ArchiveFile) => void;
    onCopy: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onCut: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onPaste: () => void;
    clipboard: { action: 'copy' | 'cut'; items: { id: number; type: 'file' | 'folder' }[] } | null;
    selectedItems: { id: number, type: 'file' | 'folder' }[];
    currentUserId: number | undefined;
    userRole: string | undefined;
    userUnitId: number | null | undefined;
    getFileIcon: (mime?: string) => React.ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onRename?: (item: { id: number; type: 'file' | 'folder'; name: string }) => void;
    onProperties?: (item: ArchiveFolder | ArchiveFile) => void;
}

export const ArchiveFileCard: React.FC<ArchiveFileCardProps> = ({
    file,
    index,
    isSelected,
    selectionCount,
    onView,
    onDownload,
    onOpenNative,
    onClick,
    onDelete,
    onCopy,
    onCut,
    onPaste,
    clipboard,
    selectedItems,
    currentUserId,
    userRole,
    userUnitId,
    getFileIcon,
    onMouseEnter,
    onMouseLeave,
    onRename,
    onProperties
}) => {
    const { t } = useTranslation();
    const canDelete = userRole === 'admin' || (file.unit_id != null && userUnitId === file.unit_id) || currentUserId === file.owner_id;
    const isElectron = (window as unknown as { electron: unknown }).electron !== undefined;

    const delLabel = (isSelected && selectionCount > 1) ? t('archive.delete_items', { count: selectionCount }) : t('archive.delete');
    const copyLabel = (isSelected && selectionCount > 1) ? t('archive.copy_items', { count: selectionCount }) : t('archive.copy');
    const cutLabel = (isSelected && selectionCount > 1) ? t('archive.cut_items', { count: selectionCount }) : t('archive.cut_action');

    const menuItems: ContextMenuItem[] = [
        { id: 'view', label: t('archive.open') },
        ...(isElectron ? [{ id: 'open-native', label: t('archive.open_in_system') }] : []),
        { id: 'download', label: t('archive.download') },
        { id: 'sep1', type: 'separator', label: '' } as ContextMenuItem,
        { id: 'cut', label: cutLabel },
        { id: 'copy', label: copyLabel },
        ...(clipboard ? [{ id: 'paste', label: t('archive.paste_items', { count: clipboard.items.length }) }] : []),
        { id: 'sep2', type: 'separator', label: '' } as ContextMenuItem,
        { id: 'rename', label: t('archive.rename'), enabled: selectionCount <= 1 },
        { id: 'delete', label: delLabel },
        { id: 'sep3', type: 'separator', label: '' } as ContextMenuItem,
        ...(isElectron ? [{ id: 'copy-path', label: t('archive.copy_path') }] : []),
        { id: 'properties', label: t('archive.properties'), enabled: selectionCount <= 1 }
    ];

    const filteredItems = menuItems.filter(item => {
        if (item.id === 'delete') return canDelete;
        return true;
    });

    const handleContextMenu = useContextMenu(filteredItems, (id) => {
        if (id === 'view') onView();
        if (id === 'download') onDownload();
        if (id === 'open-native' && onOpenNative) onOpenNative();
        if (id === 'copy') onCopy(isSelected && selectionCount > 1 ? selectedItems : [{ id: file.id, type: 'file' }]);
        if (id === 'cut') onCut(isSelected && selectionCount > 1 ? selectedItems : [{ id: file.id, type: 'file' }]);
        if (id === 'paste') onPaste();
        if (id === 'delete') onDelete(file);
        if (id === 'rename' && onRename) onRename({ id: file.id, type: 'file', name: file.title });
        if (id === 'properties' && onProperties) onProperties(file);
        if (id === 'copy-path' && isElectron) {
            window.electron!.copyToClipboard(file.file_path);
        }
    });

    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick(e, index)}
            onDoubleClick={(e) => {
                e.stopPropagation();
                if (!isElectron) {
                    onView();
                } else if (onOpenNative) {
                    onOpenNative();
                } else {
                    onDownload();
                }
            }}
            onContextMenu={handleContextMenu}
            className={cn(
                "group rounded-lg border p-5 transition-all duration-[var(--duration-slow)] cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[140px] animate-slide-up active:scale-[0.98]",
                isSelected
                    ? 'bg-primary/5 border-primary shadow-subtle ring-2 ring-primary/5'
                    : 'bg-surface border-border hover:shadow-medium hover:border-primary/20 hover:bg-surface-2 hover:-translate-y-0.5'
            )}
            style={{ animationDelay: `${index * 20}ms` }}
        >
            {canDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-danger/5 text-danger hover:bg-danger hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-[var(--duration-normal)] z-10 flex items-center justify-center shadow-sm"
                    title={t('archive.delete')}
                >
                    <Trash2 size={14} strokeWidth={2.5} />
                </button>
            )}
            <div>
                <div className="flex items-start justify-between mb-5">
                    <div className="w-14 h-14 bg-surface-3 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-[var(--duration-slow)] shadow-sm overflow-hidden shrink-0 group-hover:scale-110 group-hover:rotate-2">
                        {file.mime_type?.startsWith('image/') ? (
                            <img
                                src={`${useConfigStore.getState().serverUrl || api.defaults.baseURL}/archive/files/${file.id}/view?token=${useAuthStore.getState().token}`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            React.cloneElement(getFileIcon(file.mime_type) as React.ReactElement<any>, { size: 28, strokeWidth: 2 })
                        )}
                    </div>
                </div>

                <h3 className={cn(
                    "font-black text-secondary truncate pr-6 tracking-tight transition-colors duration-[var(--duration-fast)] leading-none",
                    isSelected ? "text-primary" : "group-hover:text-primary"
                )} title={file.title}>
                    {file.title}
                </h3>
            </div>

            <div className="flex flex-col space-y-2 mt-5 pt-4 border-t border-border/40">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-tertiary">
                    <div className="flex items-center space-x-1.5">
                        <UserIcon size={10} strokeWidth={3} />
                        <span className="truncate max-w-[90px]">{file.owner_name}</span>
                    </div>
                    <span className="tabular-nums">{formatSize(file.file_size)}</span>
                </div>
                <div className="flex items-center space-x-1.5 text-[9px] font-black uppercase tracking-widest text-tertiary tabular-nums">
                    <Clock size={10} strokeWidth={3} />
                    <span>{formatDate(file.created_at, t)}</span>
                </div>
            </div>
            {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />}
        </div>
    );
};
