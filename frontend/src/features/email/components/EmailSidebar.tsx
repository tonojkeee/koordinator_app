import React, { useState } from 'react';
import {
  Plus,
  Filter,
  ChevronDown,
  ChevronRight,
  Loader2,
  Star,
  Trash2,
  Folder,
  Book,
  MailOpen,
  type LucideIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  ContextMenu,
  type ContextMenuOption,
  SecondarySidebar,
  SearchInput,
  cn
} from '../../../design-system';
import type { EmailAccount, EmailFolder } from '../emailService';

interface SystemFolder {
  id: string;
  name: string;
  icon: LucideIcon;
  unread_count: number;
}

interface EmailSidebarProps {
  systemFolders: SystemFolder[];
  customFolders: EmailFolder[];
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenCreateFolder: () => void;
  onOpenAddressBook: () => void;
  onDeleteFolder: (id: number) => void;
  onMarkAllRead: (folderId: string) => void;
  onEmptyFolder: (folderId: 'trash' | 'spam') => void;
  account: EmailAccount | null;
  isLoading?: boolean;
}

interface SectionHeaderProps {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  variant?: 'default' | 'pinned' | 'private';
}

const SectionHeader = ({
  title,
  count,
  expanded,
  onToggle,
  variant = 'default'
}: SectionHeaderProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'pinned':
        return 'bg-amber-50/80 border-y border-amber-100/50 text-amber-700 hover:bg-amber-100/80 hover:text-amber-900';
      case 'private':
        return 'bg-cyan-50/80 border-y border-cyan-100/50 text-cyan-700 hover:bg-cyan-100/80 hover:text-cyan-900';
      default:
        return 'bg-slate-50/80 border-y border-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900';
    }
  };

  const getCountClasses = () => {
    switch (variant) {
      case 'pinned':
        return 'bg-amber-100/60 text-amber-600 group-hover:text-amber-800';
      case 'private':
        return 'bg-cyan-100/60 text-cyan-600 group-hover:text-cyan-800';
      default:
        return 'bg-slate-200/60 text-slate-500 group-hover:text-slate-700';
    }
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors group mt-0 mb-0",
        getVariantClasses()
      )}
    >
      <div className="flex items-center gap-2">
        <div className="transition-colors opacity-70 group-hover:opacity-100">
          {expanded ? <ChevronDown size={12} strokeWidth={2.5} /> : <ChevronRight size={12} strokeWidth={2.5} />}
        </div>
        <span>{title}</span>
      </div>
      {count > 0 && (
        <span className={cn("px-1.5 rounded text-[10px] font-semibold tabular-nums", getCountClasses())}>
          {count}
        </span>
      )}
    </button>
  );
};

interface FolderItemProps {
  icon: LucideIcon;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  contextOptions?: ContextMenuOption[];
}

const FolderItem: React.FC<FolderItemProps> = ({
  icon: Icon,
  label,
  count = 0,
  isActive,
  onClick,
  isFavorite,
  onToggleFavorite,
  onDelete,
  contextOptions = []
}) => {
  return (
    <ContextMenu options={contextOptions}>
      <div
        onClick={onClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-1.5 border-l-[3px] transition-all duration-200 group relative cursor-pointer",
          isActive
            ? "border-cyan-600 bg-cyan-50/60"
            : "border-transparent hover:bg-slate-50"
        )}
      >
        <div className="relative shrink-0">
          <Icon
            size={18}
            className={cn(
              "transition-colors duration-200",
              isActive ? "text-cyan-600" : "text-slate-400 group-hover:text-slate-600"
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <span className={cn(
            "truncate text-[13px] transition-colors",
            isActive ? "font-semibold text-cyan-900" : (count > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700")
          )}>
            {label}
          </span>

          <div className="flex items-center shrink-0 ml-2">
            {count > 0 ? (
              <span className="min-w-[16px] h-[16px] bg-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                {count > 99 ? '99+' : count}
              </span>
            ) : (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onToggleFavorite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className={cn(
                      "p-1 transition-colors",
                      isFavorite ? "text-amber-500" : "text-slate-400 hover:text-amber-500"
                    )}
                  >
                    <Star size={12} fill={isFavorite ? "currentColor" : "none"} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ContextMenu>
  );
};

export const EmailSidebar: React.FC<EmailSidebarProps> = ({
  systemFolders,
  customFolders,
  selectedFolder,
  onSelectFolder,
  favorites,
  onToggleFavorite,
  onOpenCreateFolder,
  onOpenAddressBook,
  onDeleteFolder,
  onMarkAllRead,
  onEmptyFolder,
  account,
  isLoading = false
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    system: true,
    custom: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const favoriteFolders = systemFolders.filter(f => favorites.includes(f.id));
  const filteredSystemFolders = systemFolders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCustomFolders = customFolders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFolderContextOptions = (folder: SystemFolder | EmailFolder, isSystem: boolean) => {
    const isFav = favorites.includes(folder.id.toString());
    const options: ContextMenuOption[] = [
      {
        label: t('email.mark_all_read'),
        icon: MailOpen,
        onClick: () => onMarkAllRead(folder.id.toString())
      },
      {
        label: isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites'),
        icon: Star,
        onClick: () => onToggleFavorite(folder.id.toString())
      }
    ];

    if (isSystem && (folder.id === 'trash' || folder.id === 'spam')) {
      options.push({
        label: t('email.empty_folder'),
        icon: Trash2,
        variant: 'danger',
        onClick: () => onEmptyFolder(folder.id as 'trash' | 'spam'),
        divider: true
      });
    }

    if (!isSystem) {
      options.push({
        label: t('common.delete'),
        icon: Trash2,
        variant: 'danger',
        onClick: () => onDeleteFolder(Number(folder.id))
      });
    }

    return options;
  };

  const actions = (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onOpenCreateFolder}
        className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-md transition-all active:scale-95"
        title={t('email.create_folder')}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
      <button className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all active:scale-95">
        <Filter size={18} strokeWidth={2.5} />
      </button>
    </div>
  );

  return (
    <SecondarySidebar title={t('email.title')} actions={actions}>
      <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
        <SearchInput
          placeholder={t('common.search') || 'Search...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="animate-spin text-cyan-500" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.loading')}</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Favorites Section */}
            {favoriteFolders.length > 0 && (
              <div className="mb-0">
                <SectionHeader
                  title={t('email.favorites')}
                  count={favoriteFolders.length}
                  expanded={expandedSections.favorites}
                  onToggle={() => toggleSection('favorites')}
                  variant="pinned"
                />
                {expandedSections.favorites && (
                  <div className="flex flex-col">
                    {favoriteFolders.map((folder) => (
                      <FolderItem
                        key={`fav-${folder.id}`}
                        icon={folder.icon}
                        label={folder.name}
                        count={folder.unread_count}
                        isActive={selectedFolder === folder.id}
                        onClick={() => onSelectFolder(folder.id)}
                        isFavorite={true}
                        onToggleFavorite={() => onToggleFavorite(folder.id)}
                        contextOptions={getFolderContextOptions(folder, true)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* System Folders Section */}
            <div className="mb-0">
              <SectionHeader
                title={t('email.system_folders') || t('common.system')}
                count={filteredSystemFolders.length}
                expanded={expandedSections.system}
                onToggle={() => toggleSection('system')}
              />
              {expandedSections.system && (
                <div className="flex flex-col">
                  {filteredSystemFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      icon={folder.icon}
                      label={folder.name}
                      count={folder.unread_count}
                      isActive={selectedFolder === folder.id}
                      onClick={() => onSelectFolder(folder.id)}
                      isFavorite={favorites.includes(folder.id)}
                      onToggleFavorite={() => onToggleFavorite(folder.id)}
                      contextOptions={getFolderContextOptions(folder, true)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Custom Folders Section */}
            {(filteredCustomFolders.length > 0 || searchQuery === '') && (
              <div className="mb-0">
                <SectionHeader
                  title={t('email.folders')}
                  count={filteredCustomFolders.length}
                  expanded={expandedSections.custom}
                  onToggle={() => toggleSection('custom')}
                  variant="private"
                />
                {expandedSections.custom && (
                  <div className="flex flex-col">
                    {filteredCustomFolders.map((folder) => (
                      <FolderItem
                        key={folder.id}
                        icon={Folder}
                        label={folder.name}
                        count={folder.unread_count}
                        isActive={selectedFolder === folder.id.toString()}
                        onClick={() => onSelectFolder(folder.id.toString())}
                        isFavorite={favorites.includes(folder.id.toString())}
                        onToggleFavorite={() => onToggleFavorite(folder.id.toString())}
                        onDelete={() => onDeleteFolder(folder.id)}
                        contextOptions={getFolderContextOptions(folder, false)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/60 shadow-sm transition-all hover:border-cyan-200 hover:shadow-md group/account">
          <Avatar
            name={account?.email_address || t('common.unknown')}
            size="sm"
            className="ring-2 ring-slate-100 group-hover/account:ring-cyan-100 transition-all"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-900 truncate leading-tight group-hover/account:text-cyan-700 transition-colors">
              {account?.email_address?.split('@')[0]}
            </p>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-black opacity-70">
              {t('email.account')}
            </p>
          </div>
          <button
            onClick={onOpenAddressBook}
            className="text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 p-2 rounded-lg transition-all active:scale-90 border border-transparent hover:border-cyan-100"
            title={t('email.address_book')}
          >
            <Book size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </SecondarySidebar>
  );
};

