import React from 'react';
import {
  Inbox, Send, Archive, Trash2, Mail,
  Folder, Star, AlertCircle, ShieldAlert,
  Plus, Book, MailOpen, Pencil
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  ContextMenu,
  type ContextMenuOption,
  SecondarySidebar
} from '../../../design-system';
import type { EmailAccount, EmailFolder, FolderStats } from '../emailService';

interface EmailSidebarProps {
  systemFolders: any[];
  customFolders: EmailFolder[];
  selectedFolder: string;
  onSelectFolder: (id: string) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onOpenCreateFolder: () => void;
  onOpenAddressBook: () => void;
  onDeleteFolder: (e: React.MouseEvent, id: number) => void;
  onMarkAllRead: (folderId: string) => void;
  onEmptyFolder: (folderId: 'trash' | 'spam') => void;
  account: EmailAccount | null;
  stats: FolderStats | null;
}

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
  stats
}) => {
  const { t } = useTranslation();

  const actions = (
    <button
      onClick={onOpenCreateFolder}
      className="p-1.5 text-muted-foreground hover:bg-surface-2 hover:text-primary rounded-lg transition-all active:scale-90"
      title={t('email.create_folder')}
    >
      <Plus size={16} strokeWidth={2.5} />
    </button>
  );

  return (
    <SecondarySidebar title={t('email.title')} actions={actions}>
      <div className="space-y-6 px-2 pb-4">
        {/* Favorites Section */}
        <section>
          <div className="px-3 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
            {t('email.favorites')}
          </div>
          <div className="space-y-0.5">
            {systemFolders.filter(f => favorites.includes(f.id)).map((folder) => {
              const isActive = selectedFolder === folder.id;
              const isFav = favorites.includes(folder.id);
              const contextOptions: ContextMenuOption[] = [
                {
                  label: t('email.mark_all_read'),
                  icon: MailOpen,
                  onClick: () => onMarkAllRead(folder.id)
                },
                {
                  label: isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites'),
                  icon: Star,
                  onClick: (e: any) => onToggleFavorite(e, folder.id)
                }
              ];

              if (folder.id === 'trash' || folder.id === 'spam') {
                contextOptions.push({
                  label: t('email.empty_folder'),
                  icon: Trash2,
                  variant: 'danger',
                  onClick: () => onEmptyFolder(folder.id as 'trash' | 'spam')
                });
              }

              return (
                <ContextMenu key={`fav-${folder.id}`} options={contextOptions}>
                  <button
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative ${
                      isActive
                        ? 'bg-primary/10 text-primary font-bold shadow-sm'
                        : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                    }`}
                  >
                    <folder.icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    {folder.unread_count > 0 && (
                      <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                        {folder.unread_count}
                      </span>
                    )}
                  </button>
                </ContextMenu>
              );
            })}
          </div>
        </section>

        {/* Folders Section */}
        <section>
          <div className="px-3 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
            {t('email.folders')}
          </div>
          <div className="space-y-0.5">
            {systemFolders.map((folder) => {
              const isActive = selectedFolder === folder.id;
              const isFav = favorites.includes(folder.id);

              return (
                <button
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                  }`}
                >
                  <folder.icon size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {folder.unread_count > 0 && (
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      {folder.unread_count}
                    </span>
                  )}
                  <div
                    onClick={(e) => onToggleFavorite(e, folder.id)}
                    className={`transition-all p-1 shrink-0 ${isFav ? 'text-amber-400 opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-amber-400'}`}
                  >
                    <Star size={12} fill={isFav ? "currentColor" : "none"} strokeWidth={1.5} />
                  </div>
                </button>
              );
            })}

            {customFolders.map((folder) => {
              const isActive = selectedFolder === folder.id.toString();
              const isFav = favorites.includes(folder.id.toString());

              return (
                <button
                  key={folder.id}
                  onClick={() => onSelectFolder(folder.id.toString())}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group relative ${
                    isActive
                      ? 'bg-primary/10 text-primary font-bold shadow-sm'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                  }`}
                >
                  <Folder size={18} className={isActive ? 'text-primary' : 'text-muted-foreground'} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  {folder.unread_count && folder.unread_count > 0 && (
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                      {folder.unread_count}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      onClick={(e) => onToggleFavorite(e, folder.id.toString())}
                      className={`transition-all p-1 ${isFav ? 'text-amber-400 opacity-100' : 'text-muted-foreground hover:text-amber-400'}`}
                    >
                      <Star size={12} fill={isFav ? "currentColor" : "none"} strokeWidth={1.5} />
                    </div>
                    <div
                      onClick={(e) => onDeleteFolder(e, folder.id)}
                      className="text-muted-foreground hover:text-destructive transition-all p-1"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Account Info */}
      <div className="mt-auto p-4 border-t border-border bg-surface-1/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-surface border border-border/50 shadow-sm">
          <Avatar name={account?.email_address || t('common.unknown')} size="sm" className="ring-2 ring-primary/5" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground truncate leading-tight">{account?.email_address?.split('@')[0]}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-black opacity-50">{t('email.account')}</p>
          </div>
          <button onClick={onOpenAddressBook} className="text-muted-foreground hover:text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-all">
            <Book size={16} strokeWidth={2} />
          </button>
        </div>
      </div>
    </SecondarySidebar>
  );
};
