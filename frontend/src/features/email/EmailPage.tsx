import React, { useCallback, useEffect, useState } from 'react';
import { emailService, type EmailAccount, type EmailFolder, type EmailMessage, type EmailMessageList, type FolderStats } from './emailService';
import { useUnreadStore } from '../../store/useUnreadStore';
import EmailList from './components/EmailList';
import EmailDetails from './components/EmailDetails';
import EmailComposer from './components/EmailComposer';
import AddressBookModal from './components/AddressBookModal';
import CreateFolderModal from './components/CreateFolderModal';
import {
    Inbox, Send, Archive, Trash2, Plus, Mail, RefreshCw,
    Book, Folder, Star, AlertCircle, Search, Filter,
    CheckSquare, ChevronDown, ShieldAlert, MailOpen, Pencil
} from 'lucide-react';
import { Avatar, ContextMenu, type ContextMenuOption } from '../../design-system';
import { useToast } from '../../design-system';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

const EmailPage: React.FC = () => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { setEmailsUnread } = useUnreadStore();
    const [account, setAccount] = useState<EmailAccount | null>(null);
    const [emails, setEmails] = useState<EmailMessageList[]>([]);
    const [customFolders, setCustomFolders] = useState<EmailFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [composerData, setComposerData] = useState<{ to?: string, subject?: string, body?: string }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<FolderStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'focused' | 'other'>('focused');
    const [lastAction, setLastAction] = useState<{ type: 'delete' | 'read' | 'star', messageId: number, previousData: { is_read?: boolean, is_starred?: boolean, is_deleted?: boolean } } | null>(null);
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('email_favorites');
        return saved ? JSON.parse(saved) : ['inbox', 'important', 'sent'];
    });

    useEffect(() => {
        localStorage.setItem('email_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const systemFolders = [
        { id: 'inbox', name: t('email.inbox'), icon: Inbox, unread_count: stats?.unread || 0 },
        { id: 'sent', name: t('email.sent'), icon: Send, unread_count: 0 },
        { id: 'important', name: t('email.important'), icon: AlertCircle, unread_count: 0 },
        { id: 'starred', name: t('email.starred'), icon: Star, unread_count: 0 },
        { id: 'archive', name: t('email.archived'), icon: Archive, unread_count: 0 },
        { id: 'spam', name: t('email.spam'), icon: ShieldAlert, unread_count: stats?.spam || 0 },
        { id: 'trash', name: t('email.trash'), icon: Trash2, unread_count: 0 }
    ];

    const fetchFolders = useCallback(async () => {
        try {
            const f = await emailService.getFolders();
            setCustomFolders(f || []);
        } catch {
            addToast({ type: 'error', title: t('email.toast_error_title'), message: t('email.toast_load_folders_error') });
        }
    }, [addToast, t]);

    const fetchStats = useCallback(async () => {
        try {
            const stats = await emailService.getStats();
            setStats(stats);
            // Sync with global store
            setEmailsUnread(stats.unread);
        } catch (err) {
            console.error(err);
        }
    }, [setEmailsUnread]);

    const fetchEmails = useCallback(async () => {
        setLoading(true);
        try {
            const msgs = await emailService.getMessages(selectedFolder);
            setEmails(msgs || []);
        } catch (err) {
            console.error(err);
            setEmails([]);
        } finally {
            setLoading(false);
        }
    }, [selectedFolder]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                const acc = await emailService.getAccount();
                setAccount(acc);
                await Promise.all([fetchFolders(), fetchStats()]);
            } catch {
                addToast({ type: 'error', title: t('email.toast_load_account_error_title'), message: t('email.toast_load_account_error') });
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [fetchFolders, fetchStats, addToast, t]);

    useEffect(() => {
        fetchEmails();
        setSelectedEmailId(null);
    }, [selectedFolder, fetchEmails]);

    // WebSocket Real-time Updates
    useEffect(() => {
        const handleNewEmail = () => {
            fetchStats();
            // If we are in the inbox, refresh the list too
            if (selectedFolder === 'inbox') {
                fetchEmails();
            }
        };

        window.addEventListener('new-email', handleNewEmail);
        return () => window.removeEventListener('new-email', handleNewEmail);
    }, [selectedFolder, fetchEmails, fetchStats]);

    const handleCreateFolder = async (name: string) => {
        try {
            await emailService.createFolder(name);
            await fetchFolders();
            setIsCreateFolderOpen(false);
            addToast({ type: 'success', title: t('email.toast_success_title'), message: t('email.toast_folder_created', { name }) });
        } catch {
            addToast({ type: 'error', title: t('email.toast_error_title'), message: t('email.toast_create_folder_error') });
        }
    };

    const handleDeleteFolder = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (confirm(t('email.delete_folder_confirm'))) {
            try {
                await emailService.deleteFolder(id);
                await fetchFolders();
                if (selectedFolder === id.toString()) setSelectedFolder('inbox');
            } catch {
                addToast({ type: 'error', title: t('email.toast_error_title'), message: t('email.toast_delete_folder_error') });
            }
        }
    };

    const handleReply = (email: EmailMessageList | EmailMessage) => {
        const replySubject = email.subject.toLowerCase().startsWith('re:') ? email.subject : `Re: ${email.subject}`;
        const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
        const isoStr = email.received_at.includes('Z') ? email.received_at : `${email.received_at}Z`;
        const replyBody = `\n\n${t('email.forwarded_message_divider')}\n${t('email.header_from')}: ${email.from_address}\n${t('email.header_to')}: ${email.to_address}\n${t('email.header_date')}: ${new Date(isoStr).toLocaleString(locale)}\n${t('email.header_subject')}: ${email.subject}\n\n`;
        setComposerData({ to: email.from_address, subject: replySubject, body: replyBody });
        setIsComposerOpen(true);
    };

    const handleForward = (email: EmailMessageList | EmailMessage) => {
        const fwdSubject = email.subject.toLowerCase().startsWith('fwd:') ? email.subject : `Fwd: ${email.subject}`;
        const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
        const isoStr2 = email.received_at.includes('Z') ? email.received_at : `${email.received_at}Z`;
        const fwdBody = `\n\n${t('email.forwarded_message_divider')}\n${t('email.header_from')}: ${email.from_address}\n${t('email.header_to')}: ${email.to_address}\n${t('email.header_date')}: ${new Date(isoStr2).toLocaleString(locale)}\n${t('email.header_subject')}: ${email.subject}\n\n`;
        setComposerData({ subject: fwdSubject, body: fwdBody });
        setIsComposerOpen(true);
    };

    const handleDeleteMessage = async (id: number) => {
        try {
            if (selectedFolder === 'trash') {
                await emailService.deleteMessage(id);
            } else {
                await emailService.updateMessage(id, { is_deleted: true });
            }
            fetchEmails();
            if (selectedEmailId === id) setSelectedEmailId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddressBookSelect = (email: string) => {
        setComposerData({ to: email });
        setIsAddressBookOpen(false);
        setIsComposerOpen(true);
    };

    const toggleFavorite = (e: React.MouseEvent, folderId: string) => {
        e.stopPropagation();
        setFavorites(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        );
    };

    const handleUndo = async () => {
        if (!lastAction) return;
        try {
            if (lastAction.type === 'delete') {
                await emailService.updateMessage(lastAction.messageId, { is_deleted: false });
            } else if (lastAction.type === 'read') {
                await emailService.updateMessage(lastAction.messageId, { is_read: lastAction.previousData.is_read });
            } else if (lastAction.type === 'star') {
                await emailService.updateMessage(lastAction.messageId, { is_starred: lastAction.previousData.is_starred });
            }
            setLastAction(null);
            fetchEmails();
            fetchStats();
            addToast({ type: 'success', title: t('common.success'), message: t('common.saved') });
        } catch {
            addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden min-h-0">
            <header className="h-14 border-b border-[#E0E0E0] flex items-center px-4 bg-white shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3 mr-8">
                    <div className="w-8 h-8 bg-[#5B5FC7] rounded-lg flex items-center justify-center shadow-sm">
                        <Mail size={18} className="text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-bold text-[#242424] uppercase tracking-wide">{t('email.title')}</span>
                </div>
            </header>

            <header className="h-12 border-b border-[#E0E0E0] flex items-center px-4 bg-[#F5F5F5] shrink-0 gap-3">
                <button
                    onClick={() => { setComposerData({}); setIsComposerOpen(true); }}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/60 rounded-md text-sm font-bold text-[#5B5FC7] transition-all border border-transparent hover:border-[#E0E0E0] hover:shadow-sm"
                >
                    <Plus size={16} strokeWidth={2} />
                    <span>{t('email.new_message')}</span>
                </button>
                <div className="w-px h-4 bg-[#E0E0E0] mx-1" />
                <button
                    onClick={async () => {
                        try {
                            await emailService.markAllAsRead();
                            await fetchStats();
                            await fetchEmails();
                            addToast({ type: 'success', title: t('common.success'), message: t('email.toast_marked_all_read') });
                        } catch {
                            addToast({ type: 'error', title: t('common.error'), message: t('email.toast_mark_read_error') });
                        }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/60 rounded-md text-sm font-medium text-[#616161] hover:text-[#242424] transition-all border border-transparent hover:border-[#E0E0E0]"
                >
                    <Mail size={16} strokeWidth={1.5} />
                    <span>{t('email.mark_all_read')}</span>
                </button>
                <button
                    onClick={handleUndo}
                    disabled={!lastAction}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all border border-transparent ${lastAction ? 'hover:bg-white/60 hover:text-[#242424] text-[#616161] hover:border-[#E0E0E0]' : 'text-[#BDBDBD] cursor-not-allowed'}`}
                >
                    <RefreshCw size={16} strokeWidth={1.5} />
                    <span>{t('email.undo')}</span>
                </button>
            </header>

            <div className="flex-1 flex overflow-hidden min-h-0">
                <aside className="w-64 flex-shrink-0 border-r border-[#E0E0E0] bg-[#F5F5F5] flex flex-col">
                    <div className="flex-1 overflow-y-auto px-3 space-y-6 pt-4 custom-scrollbar">
                        <section>
                            <div className="px-2 mb-2 text-[10px] font-bold text-[#888888] uppercase tracking-wider">{t('email.favorites')}</div>
                            <div className="space-y-0.5">
                                {systemFolders.filter(f => favorites.includes(f.id)).map((folder) => {
                                    const isActive = selectedFolder === folder.id;
                                    const isFav = favorites.includes(folder.id);
                                    const contextOptions: ContextMenuOption[] = [
                                        {
                                            label: t('email.mark_all_read'),
                                            icon: MailOpen,
                                            onClick: async () => {
                                                try {
                                                    await emailService.markAllAsRead();
                                                    fetchStats();
                                                    if (selectedFolder === folder.id) fetchEmails();
                                                } catch { console.error("Failed to mark folder as read"); }
                                            }
                                        },
                                        {
                                            label: isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites'),
                                            icon: Star,
                                            onClick: () => {
                                                setFavorites(prev =>
                                                    prev.includes(folder.id)
                                                        ? prev.filter(id => id !== folder.id)
                                                        : [...prev, folder.id]
                                                );
                                            }
                                        }
                                    ];
                                    if (folder.id === 'trash' || folder.id === 'spam') {
                                        contextOptions.push({
                                            label: t('email.empty_folder'),
                                            icon: Trash2,
                                            variant: 'danger',
                                            onClick: async () => {
                                                if (confirm(t('email.confirm_empty_folder'))) {
                                                    try {
                                                        await emailService.emptyFolder(folder.id as 'trash' | 'spam');
                                                        fetchStats();
                                                        if (selectedFolder === folder.id) fetchEmails();
                                                        addToast({ type: 'success', title: t('common.success'), message: t('common.deleted') });
                                                    } catch {
                                                        addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                                    }
                                                }
                                            }
                                        });
                                    }

                                    return (
                                        <ContextMenu key={`fav-${folder.id}`} options={contextOptions}>
                                            <button
                                                onClick={() => setSelectedFolder(folder.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${isActive
                                                    ? 'bg-white shadow-sm text-[#5B5FC7] font-bold border border-[#E0E0E0]'
                                                    : 'text-[#616161] hover:bg-[#E0E0E0]/50 hover:text-[#242424]'
                                                    }`}
                                            >
                                                <folder.icon size={18} className={isActive ? 'text-[#5B5FC7]' : 'text-[#888888] group-hover:text-[#616161]'} strokeWidth={1.5} />
                                                <span className="flex-1 text-left truncate">{folder.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {folder.unread_count > 0 && (
                                                        <span className="text-[10px] font-bold text-[#5B5FC7] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full shrink-0">{folder.unread_count}</span>
                                                    )}
                                                    <div
                                                        onClick={(e) => toggleFavorite(e, folder.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-500 transition-all p-1 shrink-0"
                                                        title={t('email.remove_from_favorites')}
                                                    >
                                                        <Star size={12} fill="currentColor" strokeWidth={1.5} />
                                                    </div>
                                                </div>
                                            </button>
                                        </ContextMenu>
                                    );
                                })}
                                {customFolders.filter(f => favorites.includes(f.id.toString())).map((folder) => {
                                    const isActive = selectedFolder === folder.id.toString();
                                    const contextOptions: ContextMenuOption[] = [
                                        {
                                            label: t('email.mark_all_read'),
                                            icon: MailOpen,
                                            onClick: () => { }
                                        },
                                        {
                                            label: t('email.remove_from_favorites'),
                                            icon: Star,
                                            onClick: () => setFavorites(prev => prev.filter(id => id !== folder.id.toString()))
                                        },
                                        {
                                            label: t('common.delete'),
                                            icon: Trash2,
                                            variant: 'danger',
                                            onClick: () => {
                                                const e = { stopPropagation: () => { } } as React.MouseEvent;
                                                handleDeleteFolder(e, folder.id);
                                            }
                                        }
                                    ];

                                    return (
                                        <ContextMenu key={`fav-custom-${folder.id}`} options={contextOptions}>
                                            <button
                                                onClick={() => setSelectedFolder(folder.id.toString())}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${isActive
                                                    ? 'bg-white shadow-sm text-[#5B5FC7] font-bold border border-[#E0E0E0]'
                                                    : 'text-[#616161] hover:bg-[#E0E0E0]/50 hover:text-[#242424]'
                                                    }`}
                                            >
                                                <Folder size={18} className={isActive ? 'text-[#5B5FC7]' : 'text-[#888888] group-hover:text-[#616161]'} strokeWidth={1.5} />
                                                <span className="flex-1 text-left truncate">{folder.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {folder.unread_count && folder.unread_count > 0 && (
                                                        <span className="text-[10px] font-bold text-[#5B5FC7] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full shrink-0">
                                                            {folder.unread_count}
                                                        </span>
                                                    )}
                                                    <div
                                                        onClick={(e) => toggleFavorite(e, folder.id.toString())}
                                                        className="opacity-0 group-hover:opacity-100 text-amber-400 hover:text-amber-500 transition-all p-1 shrink-0"
                                                        title={t('email.remove_from_favorites')}
                                                    >
                                                        <Star size={12} fill="currentColor" strokeWidth={1.5} />
                                                    </div>
                                                </div>
                                            </button>
                                        </ContextMenu>
                                    );
                                })}
                            </div>
                        </section>

                        <section>
                            <div className="px-2 mb-2 flex items-center justify-between text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                                <span>{t('email.folders')}</span>
                                <button
                                    onClick={() => setIsCreateFolderOpen(true)}
                                    className="text-[#888888] hover:text-[#5B5FC7] hover:bg-[#E0E0E0] rounded p-0.5 transition-all"
                                    title={t('email.create_folder')}
                                >
                                    <Plus size={14} strokeWidth={2} />
                                </button>
                            </div>
                            <div className="space-y-0.5">
                                {systemFolders.map((folder) => {
                                    const isActive = selectedFolder === folder.id;
                                    const isFav = favorites.includes(folder.id);
                                    const contextOptions: ContextMenuOption[] = [
                                        {
                                            label: t('email.mark_all_read'),
                                            icon: MailOpen,
                                            onClick: async () => {
                                                try {
                                                    await emailService.markAllAsRead();
                                                    fetchStats();
                                                    if (selectedFolder === folder.id) fetchEmails();
                                                } catch { console.error("Failed to mark folder as read"); }
                                            }
                                        },
                                        {
                                            label: isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites'),
                                            icon: Star,
                                            onClick: () => {
                                                setFavorites(prev =>
                                                    prev.includes(folder.id)
                                                        ? prev.filter(id => id !== folder.id)
                                                        : [...prev, folder.id]
                                                );
                                            }
                                        }
                                    ];
                                    if (folder.id === 'trash' || folder.id === 'spam') {
                                        contextOptions.push({
                                            label: t('email.empty_folder'),
                                            icon: Trash2,
                                            variant: 'danger',
                                            onClick: async () => {
                                                if (confirm(t('email.confirm_empty_folder'))) {
                                                    try {
                                                        await emailService.emptyFolder(folder.id as 'trash' | 'spam');
                                                        fetchStats();
                                                        if (selectedFolder === folder.id) fetchEmails();
                                                        addToast({ type: 'success', title: t('common.success'), message: t('common.deleted') });
                                                    } catch {
                                                        addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                                    }
                                                }
                                            }
                                        });
                                    }

                                    return (
                                        <ContextMenu key={folder.id} options={contextOptions}>

                                            <button
                                                onClick={() => setSelectedFolder(folder.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${isActive
                                                    ? 'bg-white shadow-sm text-[#5B5FC7] font-bold border border-[#E0E0E0]'
                                                    : 'text-[#616161] hover:bg-[#E0E0E0]/50 hover:text-[#242424]'
                                                    }`}
                                            >
                                                <folder.icon size={18} className={isActive ? 'text-[#5B5FC7]' : 'text-[#888888] group-hover:text-[#616161]'} strokeWidth={1.5} />
                                                <span className="flex-1 text-left truncate">{folder.name}</span>
                                                <div className="flex items-center gap-2">
                                                    {folder.unread_count > 0 && (
                                                        <span className="text-[10px] font-bold text-[#5B5FC7] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full shrink-0">{folder.unread_count}</span>
                                                    )}
                                                    <div
                                                        onClick={(e) => toggleFavorite(e, folder.id)}
                                                        className={`transition-all p-1 shrink-0 ${isFav ? 'text-amber-400 opacity-100' : 'text-[#BDBDBD] opacity-0 group-hover:opacity-100 hover:text-amber-400'}`}
                                                        title={isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites')}
                                                    >
                                                        <Star size={12} fill={isFav ? "currentColor" : "none"} strokeWidth={1.5} />
                                                    </div>
                                                </div>
                                            </button>
                                        </ContextMenu>
                                    );
                                })}
                                {customFolders.map((folder) => {
                                    const isActive = selectedFolder === folder.id.toString();
                                    const isFav = favorites.includes(folder.id.toString());
                                    const contextOptions: ContextMenuOption[] = [
                                        {
                                            label: t('email.mark_all_read'),
                                            icon: MailOpen,
                                            onClick: () => { }
                                        },
                                        {
                                            label: isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites'),
                                            icon: Star,
                                            onClick: () => {
                                                setFavorites(prev =>
                                                    prev.includes(folder.id.toString())
                                                        ? prev.filter(id => id !== folder.id.toString())
                                                        : [...prev, folder.id.toString()]
                                                );
                                            }
                                        },
                                        {
                                            label: t('email.rename_folder'),
                                            icon: Pencil,
                                            onClick: () => {
                                                addToast({ type: 'info', title: t('common.itDepartment'), message: t('common.unavailable') });
                                            }
                                        },
                                        {
                                            label: t('common.delete'),
                                            icon: Trash2,
                                            variant: 'danger',
                                            onClick: () => {
                                                const e = { stopPropagation: () => { } } as React.MouseEvent;
                                                handleDeleteFolder(e, folder.id);
                                            }
                                        }
                                    ];

                                    return (
                                        <ContextMenu key={folder.id} options={contextOptions}>

                                            <div className="relative group">
                                                <button
                                                    onClick={() => setSelectedFolder(folder.id.toString())}
                                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all group ${isActive
                                                        ? 'bg-white shadow-sm text-[#5B5FC7] font-bold border border-[#E0E0E0]'
                                                        : 'text-[#616161] hover:bg-[#E0E0E0]/50 hover:text-[#242424]'
                                                        }`}
                                                >
                                                    <Folder size={18} className={isActive ? 'text-[#5B5FC7]' : 'text-[#888888] group-hover:text-[#616161]'} strokeWidth={1.5} />
                                                    <span className="flex-1 text-left truncate">{folder.name}</span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div
                                                            onClick={(e) => toggleFavorite(e, folder.id.toString())}
                                                            className={`transition-all p-1 ${isFav ? 'text-amber-400 opacity-100' : 'text-[#BDBDBD] hover:text-amber-400'}`}
                                                            title={isFav ? t('email.remove_from_favorites') : t('email.add_to_favorites')}
                                                        >
                                                            <Star size={12} fill={isFav ? "currentColor" : "none"} strokeWidth={1.5} />
                                                        </div>
                                                        <div
                                                            onClick={(e) => handleDeleteFolder(e, folder.id)}
                                                            className="text-[#BDBDBD] hover:text-[#C4314B] transition-all p-1"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 size={14} strokeWidth={1.5} />
                                                        </div>
                                                    </div>
                                                    {folder.unread_count && folder.unread_count > 0 && (
                                                        <span className="text-[10px] font-bold text-[#5B5FC7] bg-[#EEF2FF] px-1.5 py-0.5 rounded-full shrink-0 group-hover:hidden">
                                                            {folder.unread_count}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </ContextMenu>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className="p-4 border-t border-[#E0E0E0] bg-white">
                        <div className="flex items-center gap-3">
                            <Avatar name={account?.email_address || t('common.unknown')} size="sm" className="ring-2 ring-[#F5F5F5]" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-[#242424] truncate">{account?.email_address}</p>
                                <p className="text-[10px] text-[#888888] uppercase tracking-wider font-semibold">{t('email.account')}</p>
                            </div>
                            <button onClick={() => setIsAddressBookOpen(true)} className="text-[#888888] hover:text-[#5B5FC7] hover:bg-[#F5F5F5] p-2 rounded-md transition-all">
                                <Book size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Column 2: Message List */}
                <section className="w-[400px] flex-shrink-0 border-r border-[#E0E0E0] flex flex-col bg-white overflow-hidden shadow-[1px_0_0_0_rgba(0,0,0,0.05)] z-10">
                    <header className="h-14 border-b border-[#E0E0E0] flex items-center justify-between px-4 shrink-0 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <CheckSquare size={18} className="text-[#888888]" strokeWidth={1.5} />
                            <ChevronDown size={14} className="text-[#888888]" strokeWidth={1.5} />
                        </div>
                        <div className="flex items-center gap-6 text-sm font-bold">
                            <button
                                onClick={() => setActiveTab('focused')}
                                className={`pb-4 pt-4 border-b-2 transition-all relative ${activeTab === 'focused' ? 'border-[#5B5FC7] text-[#5B5FC7]' : 'border-transparent text-[#616161] hover:text-[#242424]'}`}
                            >
                                {t('email.tabs.focused')}
                                {emails.some(e => e.is_important && !e.is_read) && (
                                    <span className="absolute top-3 -right-1.5 w-2 h-2 bg-[#5B5FC7] rounded-full border-2 border-white ring-1 ring-[#EEF2FF]" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('other')}
                                className={`pb-4 pt-4 border-b-2 transition-all relative ${activeTab === 'other' ? 'border-[#5B5FC7] text-[#5B5FC7]' : 'border-transparent text-[#616161] hover:text-[#242424]'}`}
                            >
                                {t('email.tabs.other')}
                                {emails.some(e => !e.is_important && !e.is_read) && (
                                    <span className="absolute top-3 -right-1.5 w-2 h-2 bg-[#5B5FC7] rounded-full border-2 border-white ring-1 ring-[#EEF2FF]" />
                                )}
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 text-[#616161] hover:bg-[#F5F5F5] hover:text-[#242424] rounded-md transition-colors">
                                <Filter size={18} strokeWidth={1.5} />
                            </button>
                        </div>
                    </header>

                    <div className="px-3 py-3 border-b border-[#E0E0E0] shrink-0 bg-[#F5F5F5]">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] group-focus-within:text-[#5B5FC7] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder={t('email.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-[#E0E0E0] rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] text-[#242424] placeholder-[#888888] transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                                <RefreshCw size={24} className="text-[#5B5FC7] animate-spin" />
                            </div>
                        )}
                        <EmailList
                            emails={emails
                                .filter(e =>
                                    (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (e.from_address || '').toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .filter(e => {
                                    if (activeTab === 'focused') return e.is_important;
                                    return !e.is_important;
                                })
                                .sort((a, b) => {
                                    const dateA = new Date(a.received_at.includes('Z') ? a.received_at : `${a.received_at}Z`);
                                    const dateB = new Date(b.received_at.includes('Z') ? b.received_at : `${b.received_at}Z`);
                                    return dateB.getTime() - dateA.getTime();
                                })
                            }
                            customFolders={customFolders}
                            onSelectEmail={setSelectedEmailId}
                            selectedEmailId={selectedEmailId}
                            onToggleStar={async (id, current) => {
                                try {
                                    const msg = emails.find(em => em.id === id);
                                    if (msg) setLastAction({ type: 'star', messageId: id, previousData: { is_starred: current } });
                                    await emailService.updateMessage(id, { is_starred: !current });
                                    fetchEmails();
                                    fetchStats();
                                } catch {
                                    addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                }
                            }}
                            onToggleRead={async (id, current) => {
                                try {
                                    const msg = emails.find(em => em.id === id);
                                    if (msg) setLastAction({ type: 'read', messageId: id, previousData: { is_read: current } });
                                    await emailService.updateMessage(id, { is_read: !current });
                                    fetchEmails();
                                    fetchStats();
                                } catch {
                                    addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                }
                            }}
                            onToggleImportant={async (id, current) => {
                                try {
                                    await emailService.updateMessage(id, { is_important: !current });
                                    fetchEmails();
                                    fetchStats();
                                } catch {
                                    addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                }
                            }}
                            onMoveToFolder={async (id, folderId) => {
                                try {
                                    await emailService.updateMessage(id, { folder_id: folderId });
                                    fetchEmails();
                                    fetchStats();
                                    addToast({ type: 'success', title: t('common.success'), message: t('common.saved') });
                                } catch {
                                    addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                }
                            }}
                            onArchive={async (id) => {
                                try {
                                    await emailService.updateMessage(id, { is_archived: true });
                                    fetchEmails();
                                    fetchStats();
                                    addToast({ type: 'success', title: t('common.success'), message: t('email.archived') });
                                } catch {
                                    addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                }
                            }}
                            onSpam={async (id) => {
                                try {
                                    const msg = emails.find(em => em.id === id);
                                    if (!msg) return;
                                    const newState = !msg.is_spam;
                                    await emailService.updateMessage(id, { is_spam: newState });
                                    fetchEmails();
                                    fetchStats();
                                    addToast({ type: 'success', title: t('common.success'), message: newState ? t('email.spam') : t('common.saved') });
                                } catch {
                                    addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
                                }
                            }}
                            onDelete={async (id) => {
                                const msg = emails.find(em => em.id === id);
                                if (msg) setLastAction({ type: 'delete', messageId: id, previousData: msg });
                                handleDeleteMessage(id);
                            }}
                            onReply={(id) => {
                                const msg = emails.find(em => em.id === id);
                                if (msg) handleReply(msg);
                            }}
                            onReplyAll={(id) => {
                                const msg = emails.find(em => em.id === id);
                                if (msg) handleReply(msg);
                            }}
                            onForward={(id) => {
                                const msg = emails.find(em => em.id === id);
                                if (msg) handleForward(msg);
                            }}
                            onPrint={(id) => {
                                window.open(`/api/email/messages/${id}/print`, '_blank');
                            }}
                        />
                    </div>
                </section>

                {/* Column 3: Message Detail */}
                <main className="flex-1 flex flex-col min-w-0 bg-white relative overflow-hidden">
                    {selectedEmailId ? (
                        <EmailDetails
                            emailId={selectedEmailId}
                            customFolders={customFolders}
                            onEmailUpdate={fetchEmails}
                            onStatsUpdate={fetchStats}
                            onReply={handleReply}
                            onForward={handleForward}
                            onDelete={handleDeleteMessage}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#F5F5F5]">
                            <div className="w-24 h-24 bg-white rounded-full shadow-sm border border-[#E0E0E0] flex items-center justify-center mb-6">
                                <Mail size={40} className="text-[#BDBDBD]" strokeWidth={1} />
                            </div>
                            <h3 className="text-xl font-bold text-[#242424] mb-2">{t('email.select_message')}</h3>
                            <p className="text-[#616161] max-w-xs">{t('email.select_message_description')}</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {isComposerOpen && (
                <EmailComposer
                    onClose={() => setIsComposerOpen(false)}
                    initialTo={composerData.to}
                    initialSubject={composerData.subject}
                    initialBody={composerData.body}
                    onSent={fetchEmails}
                />
            )}
            {isAddressBookOpen && (
                <AddressBookModal
                    onClose={() => setIsAddressBookOpen(false)}
                    onSelectUser={handleAddressBookSelect}
                />
            )}
            {isCreateFolderOpen && (
                <CreateFolderModal
                    isOpen={isCreateFolderOpen}
                    onClose={() => setIsCreateFolderOpen(false)}
                    onCreate={handleCreateFolder}
                />
            )}
        </div>
    );
};

export default EmailPage;
