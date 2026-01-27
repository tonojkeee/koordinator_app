import React, { useEffect, useState } from 'react';
import type { User } from '../../../types';
import { emailService } from '../emailService';
import { Search, Mail, Book } from 'lucide-react';
import { Avatar } from '../../../design-system';
import { useAuthStore } from '../../../store/useAuthStore';
import { useConfigStore } from '../../../store/useConfigStore';
import api from '../../../api/client';
import { Modal, SearchInput } from '../../../design-system';
import { useTranslation } from 'react-i18next';

interface AddressBookModalProps {
    onClose: () => void;
    onSelectUser: (email: string) => void;
}

const AddressBookModal: React.FC<AddressBookModalProps> = ({ onClose, onSelectUser }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

    // Auth & Config
    const { token } = useAuthStore();
    const { serverUrl } = useConfigStore();

    useEffect(() => {
        loadUsers();
        fetchOnlineUsers();
    }, []);

    // WebSocket for Real-time Online Status
    useEffect(() => {
        if (!token) return;

        const apiBase = serverUrl || import.meta.env.VITE_API_URL || '';
        let wsBase = '';

        if (apiBase.startsWith('http')) {
            wsBase = apiBase.replace(/^http/, 'ws').replace(/\/api$/, '');
        } else {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            wsBase = `${protocol}//${host}`;
        }

        const wsUrl = `${wsBase}/api/chat/ws/user?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            // console.log('AddressBook WS connected');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'user_presence') {
                    setOnlineUserIds(prev => {
                        const next = new Set(prev);
                        if (data.status === 'online') {
                            next.add(data.user_id);
                        } else {
                            next.delete(data.user_id);
                        }
                        return next;
                    });
                }
            } catch (e) {
                console.error('WS parse error', e);
            }
        };

        return () => {
            socket.close();
        };
    }, [token, serverUrl]);

    const loadUsers = async () => {
        try {
            const data = await emailService.getAddressBook();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load address book", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOnlineUsers = async () => {
        try {
            // We use the auth endpoint directly for now as emailService doesn't have it
            // Ideally should be in a shared service
            const response = await api.get('/auth/users/online');
            setOnlineUserIds(new Set(response.data.online_user_ids));
        } catch (error) {
            console.error("Failed to load online users", error);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#5B5FC7] rounded-md text-white shadow-sm">
                        <Book size={18} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#242424] leading-none">{t('email.address_book_modal.title')}</h2>
                        <p className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide mt-1">{t('email.address_book_modal.users_count', { count: users.length })}</p>
                    </div>
                </div>
            }
            size="xl"
            className="h-[80vh]"
        >
            <div className="flex flex-col h-full -m-4 sm:-m-5">
                {/* Search Bar */}
                <div className="px-5 py-3 border-b border-[#E0E0E0] bg-white">
                    <SearchInput
                        placeholder={t('email.address_book_modal.search_placeholder')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch('')}
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 bg-[#F5F5F5]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 animate-in fade-in duration-500">
                            <div className="w-8 h-8 rounded-full border-2 border-[#E0E0E0] border-t-[#5B5FC7] animate-spin" />
                            <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{t('email.address_book_modal.loading')}</div>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filteredUsers.map((user, index) => {
                                const isOnline = onlineUserIds.has(user.id);
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => user.email && onSelectUser(user.email)}
                                        disabled={!user.email}
                                        className="flex items-center gap-3 p-3 bg-white hover:bg-[#EEF2FF] border border-[#E0E0E0] hover:border-[#5B5FC7]/30 rounded-md shadow-sm transition-all duration-200 group text-left relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar
                                                src={user.avatar_url}
                                                name={user.full_name || user.username}
                                                size="md"
                                                status={isOnline ? 'online' : undefined}
                                                className="shadow-sm"
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0 z-10">
                                            <div className="font-semibold text-[#242424] text-sm truncate group-hover:text-[#5B5FC7] transition-colors">
                                                {user.full_name || user.username}
                                            </div>

                                            {user.position && (
                                                <div className="text-[10px] font-medium text-[#616161] uppercase tracking-wide truncate mb-0.5">
                                                    {user.position}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 text-[11px] text-[#616161] truncate mt-0.5">
                                                <Mail size={12} className={user.email ? "text-[#5B5FC7]" : "text-[#BDBDBD]"} strokeWidth={1.5} />
                                                <span className={`truncate ${user.email ? "" : "italic text-[#BDBDBD] font-medium"}`}>
                                                    {user.email || t('email.address_book_modal.no_email')}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-[#888888] animate-in fade-in duration-500">
                            <div className="inline-flex p-3 bg-white rounded-full mb-3 text-[#BDBDBD] shadow-sm border border-[#E0E0E0]">
                                <Search size={24} strokeWidth={1.5} />
                            </div>
                            <div className="font-bold text-[10px] uppercase tracking-widest opacity-80">{t('email.address_book_modal.no_users')}</div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AddressBookModal;
