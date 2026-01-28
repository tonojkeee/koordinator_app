import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    FileIcon,
    Archive as ArchiveIcon,
    FileText,
    Image as ImageIcon,
    FileCode,
    Folder as FolderIcon,
    Trash2
} from 'lucide-react';
import type { ContextMenuItem } from '../../../types';
import { useContextMenu } from '../../../hooks/useContextMenu';
import type { ArchiveFolder, ArchiveFile } from '../types';
import { formatDate } from '../utils';
import { cn } from '../../../design-system';

interface ArchiveFolderListRowProps {
    folder: ArchiveFolder;
    index: number;
    isSelected: boolean;
    selectionCount: number;
    onNavigate: (folder: ArchiveFolder) => void;
    onClick: (e: React.MouseEvent, type: 'file' | 'folder', item: { type: 'file' | 'folder'; data: ArchiveFolder | ArchiveFile }, index: number) => void;
    onDelete: (folder: ArchiveFolder) => void;
    onCopy: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onCut: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onPaste: () => void;
    clipboard: { action: 'copy' | 'cut'; items: { id: number; type: 'file' | 'folder' }[] } | null;
    selectedItems: { id: number, type: 'file' | 'folder' }[];
    currentUserId: number | undefined;
    userRole: string | undefined;
    userUnitId: number | null | undefined;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onRename?: (item: { id: number; type: 'file' | 'folder'; name: string }) => void;
    onProperties?: (item: ArchiveFolder | ArchiveFile) => void;
}

export const ArchiveFolderItem: React.FC<ArchiveFolderListRowProps> = ({
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
            className={cn(
                "grid grid-cols-12 gap-4 px-6 py-2 border-b border-border/40 transition-all duration-300 cursor-pointer group items-center relative overflow-hidden",
                isSelected ? 'bg-primary/5 shadow-[inset_3px_0_0_0_var(--teams-brand)]' : 'hover:bg-surface-2'
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick(e, 'folder', { type: 'folder', data: folder }, index)}
            onDoubleClick={(e) => { e.stopPropagation(); onNavigate(folder); }}
            onContextMenu={handleContextMenu}
        >
            <div className="col-span-6 flex items-center space-x-4 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-all duration-300 shrink-0 bg-surface-3 rounded-lg shadow-sm group-hover:scale-110">
                    <FolderIcon size={18} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />
                </div>
                <span className={cn(
                    "text-sm font-bold truncate transition-colors tracking-tight",
                    isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                    {folder.name}
                </span>
            </div>
            <div className="col-span-2 flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
                —
            </div>
            <div className="col-span-3 flex items-center text-[10px] text-muted-foreground font-bold tabular-nums uppercase tracking-widest opacity-60">
                {formatDate(folder.created_at, t)}
            </div>
            <div className="col-span-1 flex items-center justify-end">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(folder); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                >
                    <Trash2 size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};

const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <FileIcon size={16} strokeWidth={1.5} />;
    
    if (mimeType.startsWith('image/')) return <ImageIcon size={16} strokeWidth={1.5} />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText size={16} strokeWidth={1.5} />;
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return <ArchiveIcon size={16} strokeWidth={1.5} />;
    if (mimeType.includes('text') || mimeType.includes('code') || mimeType.includes('json') || mimeType.includes('xml')) return <FileCode size={16} strokeWidth={1.5} />;
    
    return <FileIcon size={16} strokeWidth={1.5} />;
};

interface ArchiveFileListRowProps {
    file: ArchiveFile;
    index: number;
    isSelected: boolean;
    selectionCount: number;
    onClick: (e: React.MouseEvent, type: 'file' | 'folder', item: { type: 'file' | 'folder'; data: ArchiveFolder | ArchiveFile }, index: number) => void;
    onDelete: (file: ArchiveFile) => void;
    onCopy: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onCut: (items: { id: number, type: 'file' | 'folder' }[]) => void;
    onPaste: () => void;
    clipboard: { action: 'copy' | 'cut'; items: { id: number; type: 'file' | 'folder' }[] } | null;
    selectedItems: { id: number, type: 'file' | 'folder' }[];
    currentUserId: number | undefined;
    userRole: string | undefined;
    userUnitId: number | null | undefined;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    onRename?: (item: { id: number; type: 'file' | 'folder'; name: string }) => void;
    onProperties?: (item: ArchiveFolder | ArchiveFile) => void;
}

export const ArchiveFileItem: React.FC<ArchiveFileListRowProps> = ({
    file,
    index,
    isSelected,
    selectionCount,
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
    const canDelete = userRole === 'admin' || (file.unit_id != null && userUnitId === file.unit_id) || currentUserId === file.owner_id;
    const fileSize = t('archive.size_bytes', { count: file.file_size || 0 });

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
        if (id === 'copy') onCopy(isSelected && selectionCount > 1 ? selectedItems : [{ id: file.id, type: 'file' }]);
        if (id === 'cut') onCut(isSelected && selectionCount > 1 ? selectedItems : [{ id: file.id, type: 'file' }]);
        if (id === 'paste') onPaste();
        if (id === 'delete') onDelete(file);
        if (id === 'rename' && onRename) onRename({ id: file.id, type: 'file', name: file.title });
        if (id === 'properties' && onProperties) onProperties(file);
    });

    return (
        <div
            className={cn(
                "grid grid-cols-12 gap-4 px-6 py-2 border-b border-border/40 transition-all duration-300 cursor-pointer group items-center relative overflow-hidden",
                isSelected ? 'bg-primary/5 shadow-[inset_3px_0_0_0_var(--teams-brand)]' : 'hover:bg-surface-2'
            )}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={(e) => onClick(e, 'file', { type: 'file', data: file }, index)}
            onContextMenu={handleContextMenu}
        >
            <div className="col-span-6 flex items-center space-x-4 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all duration-300 shrink-0 bg-surface-3 rounded-lg shadow-sm group-hover:scale-110 group-hover:bg-primary/5">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {React.cloneElement(getFileIcon(file.mime_type) as React.ReactElement<any>, { size: 18, strokeWidth: 2.5 } as any)}
                </div>
                <span className={cn(
                    "text-sm font-bold truncate transition-colors tracking-tight",
                    isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                )}>
                    {file.title}
                </span>
            </div>
            <div className="col-span-2 flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60 tabular-nums">
                {fileSize}
            </div>
            <div className="col-span-3 flex items-center text-[10px] text-muted-foreground font-bold tabular-nums uppercase tracking-widest opacity-60">
                {formatDate(file.created_at, t)}
            </div>
            <div className="col-span-1 flex items-center justify-end">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(file); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                >
                    <Trash2 size={16} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
};
