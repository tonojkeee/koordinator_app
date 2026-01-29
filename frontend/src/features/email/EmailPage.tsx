import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { emailService, type EmailAccount, type EmailFolder, type EmailMessage, type EmailMessageList, type FolderStats } from './emailService';
import { useUnreadStore } from '../../store/useUnreadStore';
import EmailList from './components/EmailList';
import EmailDetails from './components/EmailDetails';
import EmailComposer from './components/EmailComposer';
import AddressBookModal from './components/AddressBookModal';
import CreateFolderModal from './components/CreateFolderModal';
import { EmailSidebar } from './components/EmailSidebar';
import {
    Plus, Mail, RefreshCw,
    Search,
    MailOpen,
    Inbox, Send, Archive, Trash2, AlertCircle, ShieldAlert, Star,
    X, FolderInput, Book, Keyboard
} from 'lucide-react';
import { Button, cn } from '../../design-system';
import { useUIStore } from '../../stores/useUIStore';
import { useToast } from '../../design-system';
import { useTranslation } from 'react-i18next';

const EmailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();
    const { setEmailsUnread } = useUnreadStore();
    const setSecondaryNavContent = useUIStore(state => state.setSecondaryNavContent);
    const setActiveModule = useUIStore(state => state.setActiveModule);
    const [account, setAccount] = useState<EmailAccount | null>(null);
    const [emails, setEmails] = useState<EmailMessageList[]>([]);
    const [customFolders, setCustomFolders] = useState<EmailFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState('inbox');
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [composerData, setComposerData] = useState<{ to?: string, subject?: string, body?: string }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState<FolderStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastAction, setLastAction] = useState<{ type: 'delete' | 'read' | 'star', messageId: number, previousData: { is_read?: boolean, is_starred?: boolean, is_deleted?: boolean } } | null>(null);
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('email_favorites');
        return saved ? JSON.parse(saved) : ['inbox', 'important', 'sent'];
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Filtered emails based on search
    const filteredEmails = useMemo(() => {
        return emails
            .filter(e =>
                (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.from_address || '').toLowerCase().includes(searchQuery.toLowerCase())
            )
            .sort((a, b) => {
                const dateA = new Date(a.received_at.includes('Z') ? a.received_at : `${a.received_at}Z`);
                const dateB = new Date(b.received_at.includes('Z') ? b.received_at : `${b.received_at}Z`);
                return dateB.getTime() - dateA.getTime();
            });
    }, [emails, searchQuery]);

    useEffect(() => {
        localStorage.setItem('email_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const systemFolders = useMemo(() => [
        { id: 'inbox', name: t('email.inbox'), icon: Inbox, unread_count: stats?.unread || 0 },
        { id: 'sent', name: t('email.sent'), icon: Send, unread_count: 0 },
        { id: 'important', name: t('email.important'), icon: AlertCircle, unread_count: 0 },
        { id: 'starred', name: t('email.starred'), icon: Star, unread_count: 0 },
        { id: 'archive', name: t('email.archived'), icon: Archive, unread_count: 0 },
        { id: 'spam', name: t('email.spam'), icon: ShieldAlert, unread_count: stats?.spam || 0 },
        { id: 'trash', name: t('email.trash'), icon: Trash2, unread_count: 0 }
    ], [t, stats]);

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

    const handleToggleSelect = useCallback((id: number, shiftKey?: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);

                // Range selection logic
                if (shiftKey && lastSelectedId !== null) {
                    const filteredEmails = emails
                        .filter(e =>
                            (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (e.from_address || '').toLowerCase().includes(searchQuery.toLowerCase())
                        );

                    const lastIndex = filteredEmails.findIndex(e => e.id === lastSelectedId);
                    const currentIndex = filteredEmails.findIndex(e => e.id === id);

                    if (lastIndex !== -1 && currentIndex !== -1) {
                        const start = Math.min(lastIndex, currentIndex);
                        const end = Math.max(lastIndex, currentIndex);
                        for (let i = start; i <= end; i++) {
                            next.add(filteredEmails[i].id);
                        }
                    }
                }
            }
            setLastSelectedId(id);
            return next;
        });
    }, [emails, lastSelectedId, searchQuery]);

    const handleSelectAll = useCallback(() => {
        const filteredEmails = emails
            .filter(e =>
                (e.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (e.from_address || '').toLowerCase().includes(searchQuery.toLowerCase())
            );

        setSelectedIds(new Set(filteredEmails.map(e => e.id)));
    }, [emails, searchQuery]);

    const handleDeselectAll = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur();
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'j': { // Next email
                    e.preventDefault();
                    if (filteredEmails.length === 0) return;
                    if (selectedEmailId === null) {
                        setSelectedEmailId(filteredEmails[0].id);
                    } else {
                        const currentIndex = filteredEmails.findIndex(m => m.id === selectedEmailId);
                        if (currentIndex < filteredEmails.length - 1) {
                            setSelectedEmailId(filteredEmails[currentIndex + 1].id);
                        }
                    }
                    break;
                }
                case 'k': { // Previous email
                    e.preventDefault();
                    if (filteredEmails.length === 0) return;
                    if (selectedEmailId === null) {
                        setSelectedEmailId(filteredEmails[0].id);
                    } else {
                        const currentIndex = filteredEmails.findIndex(m => m.id === selectedEmailId);
                        if (currentIndex > 0) {
                            setSelectedEmailId(filteredEmails[currentIndex - 1].id);
                        }
                    }
                    break;
                }
                case 'x': { // Toggle selection
                    e.preventDefault();
                    if (selectedEmailId !== null) {
                        handleToggleSelect(selectedEmailId);
                    }
                    break;
                }
                case 'c': { // Compose
                    e.preventDefault();
                    setComposerData({});
                    setIsComposerOpen(true);
                    break;
                }
                case '/': { // Search
                    e.preventDefault();
                    searchInputRef.current?.focus();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredEmails, selectedEmailId, handleToggleSelect]);

    const handleBulkDelete = async () => {
        if (confirm(t('email.bulk_delete_confirm', { count: selectedIds.size }))) {
            try {
                setLoading(true);
                await Promise.all(Array.from(selectedIds).map(id =>
                    selectedFolder === 'trash'
                        ? emailService.deleteMessage(id)
                        : emailService.updateMessage(id, { is_deleted: true })
                ));
                setSelectedIds(new Set());
                fetchEmails();
                fetchStats();
                addToast({ type: 'success', title: t('common.success'), message: t('common.deleted') });
            } catch {
                addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleBulkToggleRead = async (isRead: boolean) => {
        try {
            setLoading(true);
            await Promise.all(Array.from(selectedIds).map(id =>
                emailService.updateMessage(id, { is_read: isRead })
            ));
            fetchEmails();
            fetchStats();
            addToast({ type: 'success', title: t('common.success'), message: t('common.saved') });
        } catch {
            addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkArchive = async () => {
        try {
            setLoading(true);
            await Promise.all(Array.from(selectedIds).map(id =>
                emailService.updateMessage(id, { is_archived: true })
            ));
            setSelectedIds(new Set());
            fetchEmails();
            fetchStats();
            addToast({ type: 'success', title: t('common.success'), message: t('email.archived') });
        } catch {
            addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
        } finally {
            setLoading(false);
        }
    };

    const handleBulkMoveToFolder = async (folderId: number | null) => {
        try {
            setLoading(true);
            await Promise.all(Array.from(selectedIds).map(id =>
                emailService.updateMessage(id, { folder_id: folderId })
            ));
            setSelectedIds(new Set());
            fetchEmails();
            fetchStats();
            addToast({ type: 'success', title: t('common.success'), message: t('common.saved') });
        } catch {
            addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails();
        setSelectedEmailId(null);
        setSelectedIds(new Set());
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

    const handleDeleteFolder = useCallback(async (id: number) => {
        if (confirm(t('email.delete_folder_confirm'))) {
            try {
                await emailService.deleteFolder(id);
                await fetchFolders();
                if (selectedFolder === id.toString()) setSelectedFolder('inbox');
            } catch {
                addToast({ type: 'error', title: t('email.toast_error_title'), message: t('email.toast_delete_folder_error') });
            }
        }
    }, [t, fetchFolders, selectedFolder, addToast]);

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

    const toggleFavorite = useCallback((folderId: string) => {
        setFavorites(prev =>
            prev.includes(folderId)
                ? prev.filter(id => id !== folderId)
                : [...prev, folderId]
        );
    }, []);

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

    const handleMarkAllRead = useCallback(async () => {
        try {
            await emailService.markAllAsRead();
            fetchStats();
            fetchEmails();
        } catch {
            console.error("Failed to mark folder as read");
        }
    }, [fetchStats, fetchEmails]);

    const handleEmptyFolder = useCallback(async (folderId: 'trash' | 'spam') => {
        if (confirm(t('email.confirm_empty_folder'))) {
            try {
                await emailService.emptyFolder(folderId);
                fetchStats();
                fetchEmails();
                addToast({ type: 'success', title: t('common.success'), message: t('common.deleted') });
            } catch {
                addToast({ type: 'error', title: t('common.error'), message: t('email.toast_error_title') });
            }
        }
    }, [t, fetchStats, fetchEmails, addToast]);

    useEffect(() => {
        setActiveModule('email');
        setSecondaryNavContent(
            <EmailSidebar
                systemFolders={systemFolders}
                customFolders={customFolders}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
                favorites={favorites}
                onToggleFavorite={toggleFavorite}
                onOpenCreateFolder={() => setIsCreateFolderOpen(true)}
                onOpenAddressBook={() => setIsAddressBookOpen(true)}
                onDeleteFolder={handleDeleteFolder}
                onMarkAllRead={handleMarkAllRead}
                onEmptyFolder={handleEmptyFolder}
                account={account}
                isLoading={loading}
            />
        );
        return () => setSecondaryNavContent(null);
    }, [
        setActiveModule,
        setSecondaryNavContent,
        systemFolders,
        customFolders,
        selectedFolder,
        favorites,
        toggleFavorite,
        handleDeleteFolder,
        handleMarkAllRead,
        handleEmptyFolder,
        account
    ]);

    const currentFolder = useMemo(() => {
        const sys = systemFolders.find(f => f.id === selectedFolder);
        if (sys) return sys;
        return customFolders.find(f => f.id.toString() === selectedFolder);
    }, [selectedFolder, systemFolders, customFolders]);

    const FolderIcon = currentFolder && 'icon' in currentFolder ? (currentFolder.icon as any) : Mail;

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden animate-in fade-in duration-300 relative">
            <div className="flex flex-col flex-1 bg-white overflow-hidden">
                {/* Unified Header */}
                <header className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-white z-40 shrink-0">
                    {selectedIds.size > 0 ? (
                        /* Bulk Actions Header */
                        <div className="flex-1 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleDeselectAll}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                                    title={t('common.cancel')}
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-extrabold text-slate-900">
                                        {t('email.selected_count', { count: selectedIds.size })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleBulkToggleRead(true)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                                    title={t('email.list_tooltip_mark_read')}
                                >
                                    <MailOpen size={20} />
                                </button>
                                <button
                                    onClick={() => handleBulkToggleRead(false)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                                    title={t('email.list_tooltip_mark_unread')}
                                >
                                    <Mail size={20} />
                                </button>
                                <button
                                    onClick={handleBulkArchive}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                                    title={t('email.archived')}
                                >
                                    <Archive size={20} />
                                </button>

                                <div className="relative group/folder-header">
                                    <button
                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-xl transition-all"
                                        title={t('email.details_tooltip_move_to')}
                                    >
                                        <FolderInput size={20} />
                                    </button>
                                    <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden opacity-0 invisible group-hover/folder-header:opacity-100 group-hover/folder-header:visible transition-all z-50">
                                        <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                                                {t('email.details_tooltip_move_to')}
                                            </div>
                                            <button
                                                onClick={() => handleBulkMoveToFolder(null)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-2"
                                            >
                                                <Inbox size={14} className="text-slate-400" />
                                                {t('email.inbox')}
                                            </button>
                                            {customFolders.map(f => (
                                                <button
                                                    key={f.id}
                                                    onClick={() => handleBulkMoveToFolder(f.id)}
                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-2"
                                                >
                                                    <FolderInput size={14} className="text-slate-400" />
                                                    {f.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-px h-6 bg-slate-100 mx-1" />

                                <button
                                    onClick={handleBulkDelete}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title={t('common.delete')}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Standard Header */
                        <>
                            <div className="flex items-center gap-4 min-w-[240px]">
                                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100/50">
                                    <FolderIcon size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="font-extrabold text-slate-900 truncate leading-tight tracking-tight">
                                        {currentFolder?.name || t('email.title')}
                                    </h1>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full transition-all duration-500 shadow-sm",
                                            loading ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
                                        )} />
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            {loading ? t('common.loading') : (
                                                <>
                                                    <span className="text-slate-900 font-extrabold">{emails.length}</span> {t('common.messages', { count: emails.length })}
                                                    {stats?.unread && selectedFolder === 'inbox' ? (
                                                        <>
                                                            <span className="mx-2 opacity-30">|</span>
                                                            <span className="text-cyan-700 font-extrabold">{stats.unread}</span> {t('email.unread')}
                                                        </>
                                                    ) : null}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Search in the middle */}
                            <div className="flex-1 max-w-xl px-8">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={16} />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder={t('email.search_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/5 text-slate-900 placeholder-slate-400 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 min-w-[240px] justify-end">
                                <Button
                                    onClick={() => { setComposerData({}); setIsComposerOpen(true); }}
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus size={18} />}
                                    className="bg-cyan-700 hover:bg-cyan-800 text-white shadow-md shadow-cyan-500/20 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <span className="hidden sm:inline">{t('email.new_message')}</span>
                                </Button>

                                <div className="w-px h-6 bg-slate-100 mx-1.5" />

                                <button
                                    onClick={handleMarkAllRead}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-xl transition-all active:scale-95"
                                    title={t('email.mark_all_read')}
                                >
                                    <MailOpen size={20} strokeWidth={2.2} />
                                </button>

                                <button
                                    onClick={handleUndo}
                                    disabled={!lastAction}
                                    className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95",
                                        lastAction ? "text-slate-500 hover:text-cyan-700 hover:bg-cyan-50" : "text-slate-200 cursor-not-allowed"
                                    )}
                                    title={t('email.undo')}
                                >
                                    <RefreshCw size={20} strokeWidth={2.2} className={cn(loading && "animate-spin")} />
                                </button>
                            </div>
                        </>
                    )}
                </header>

                <div className="flex flex-1 overflow-hidden min-h-0 bg-white relative">
                    {/* Column 2: Message List */}
                    <aside className="w-[400px] flex-shrink-0 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                            {loading && emails.length === 0 && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center animate-fade-in">
                                    <RefreshCw size={24} className="text-cyan-500 animate-spin mb-2" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.loading')}</span>
                                </div>
                            )}
                            <EmailList
                                emails={filteredEmails}
                                customFolders={customFolders}
                                onSelectEmail={setSelectedEmailId}
                                selectedEmailId={selectedEmailId}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onSelectAll={handleSelectAll}
                                onDeselectAll={handleDeselectAll}
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
                    </aside>

                    {/* Column 3: Message Detail */}
                    <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden relative">
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
                            <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 overflow-y-auto">
                                <div className="relative mb-12 group">
                                    <div className="relative">
                                        <div className="w-40 h-40 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-105 transition-all duration-500 ring-8 ring-white/50 border border-slate-100">
                                            <Mail className="w-20 h-20 text-cyan-600" strokeWidth={1.5} />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-cyan-700 rounded-2xl shadow-lg flex items-center justify-center border-4 border-white text-white">
                                            <Inbox className="w-8 h-8" />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center space-y-4 max-w-2xl mb-16 px-4">
                                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                        {t('email.welcome_title') || t('email.select_message')}
                                    </h2>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        {t('email.welcome_description') || t('email.select_message_description')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl px-4">
                                    <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group/tip flex flex-col items-center sm:items-start text-center sm:text-left">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5 group-hover/tip:scale-110 transition-transform duration-300">
                                            <Keyboard size={24} />
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 text-lg mb-2">{t('email.welcome_tip_shortcuts_title') || "Quick Shortcuts"}</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{t('email.welcome_tip_shortcuts_desc') || "Use 'J' and 'K' to navigate, 'C' to compose, and '/' to search your messages instantly."}</p>
                                    </div>
                                    <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group/tip flex flex-col items-center sm:items-start text-center sm:text-left">
                                        <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-5 group-hover/tip:scale-110 transition-transform duration-300">
                                            <Book size={24} />
                                        </div>
                                        <h3 className="font-extrabold text-slate-900 text-lg mb-2">{t('email.welcome_tip_address_book_title') || "Address Book"}</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{t('email.welcome_tip_address_book_desc') || "Quickly find colleagues and check their online status before sending an important message."}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
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
