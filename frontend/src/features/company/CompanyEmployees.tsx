import React, { useState } from 'react';
import type { User } from '../../types';
import { Search, Building2, Phone, MessageSquare, Loader2, Mail, CheckSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, cn } from '../../design-system';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

import UserProfileModal from './components/UserProfileModal';

interface CompanyEmployeesProps {
    users: User[];
    isLoading: boolean;
    selectedUserIds: number[];
    onToggleSelection: (id: number) => void;
    onStartDM: (id: number) => void;
    isDMPending: boolean;
    pendingDMUserId?: unknown;
    currentUser: User | null;
}

const CompanyEmployees: React.FC<CompanyEmployeesProps> = ({
    users,
    isLoading,
    selectedUserIds,
    onToggleSelection,
    onStartDM,
    isDMPending,
    pendingDMUserId,
    currentUser
}) => {
    const { t } = useTranslation();
    const [itemsPerPage] = useState(24);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    const handleViewUser = (e: React.MouseEvent, user: User) => {
        e.stopPropagation();
        setViewingUser(user);
    };

    const { data: onlineData } = useQuery<{ online_user_ids: number[] }>({
        queryKey: ['users', 'online'],
        queryFn: async () => {
            const res = await api.get('/auth/users/online');
            return res.data;
        },
        refetchInterval: 30000,
    });
    const onlineUserIds = new Set(onlineData?.online_user_ids || []);

    // Helper: Group Users by Unit
    const groupedUsers = users.reduce((groups, user) => {
        const unitName = user.unit_name || t('company.no_unit');
        if (!groups[unitName]) {
            groups[unitName] = [];
        }
        groups[unitName].push(user);
        return groups;
    }, {} as Record<string, User[]>);

    // Helper: Sort Groups and Users within Groups
    const sortedGroupKeys = Object.keys(groupedUsers).sort((a, b) => {
        if (a === t('company.no_unit')) return 1;
        if (b === t('company.no_unit')) return -1;
        return a.localeCompare(b);
    });

    sortedGroupKeys.forEach(key => {
        groupedUsers[key].sort((a, b) => (a.full_name || a.username).localeCompare(b.full_name || b.username));
    });

    const flatSortedUsers = sortedGroupKeys.reduce((acc, unit) => {
        return [...acc, ...groupedUsers[unit]];
    }, [] as User[]);

    const paginatedUsers = flatSortedUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page if users content changes drastically
    React.useEffect(() => {
        setCurrentPage(1);
    }, [users.length]);

    return (
        <div className="w-full h-full flex flex-col">
            {/* List Header Labels */}
            {users.length > 0 && !isLoading && (
                <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border mb-4 px-6">
                    <div className="max-w-7xl mx-auto hidden lg:grid lg:grid-cols-[48px_2.5fr_1.5fr_1.2fr_1fr_48px] gap-6 py-4 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                        <div className="flex justify-center shrink-0">#</div>
                        <div>{t('common.fullName')}</div>
                        <div>{t('common.email')}</div>
                        <div>{t('common.phoneNumber')}</div>
                        <div>{t('common.cabinet')}</div>
                        <div className="text-center">{t('common.actions')}</div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-10 custom-scrollbar">
                {isLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4 animate-fade-in">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-70">{t('users.syncDirectory')}</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center animate-scale-in">
                        <div className="w-20 h-20 bg-surface-2 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Search size={40} className="text-muted-foreground/20" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground opacity-60">{t('users.noUsersFound')}</p>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-2">
                        {paginatedUsers.map((user, index) => {
                            const currentUnit = user.unit_name || t('company.no_unit');
                            const prevUser = index > 0 ? paginatedUsers[index - 1] : null;
                            const prevUnit = prevUser?.unit_name || t('company.no_unit');
                            const showHeader = index === 0 || currentUnit !== prevUnit;

                            return (
                                <React.Fragment key={user.id}>
                                    {showHeader && (
                                        <div className="pt-8 pb-3 px-2 flex items-center gap-4 animate-fade-in">
                                            <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.15em] whitespace-nowrap bg-primary/5 px-3 py-1 rounded-full border border-primary/10 shadow-sm">
                                                {currentUnit}
                                            </h3>
                                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                                        </div>
                                    )}

                                    <div
                                        onClick={() => onToggleSelection(user.id)}
                                        className={cn(
                                            "group flex flex-col lg:grid lg:grid-cols-[48px_2.5fr_1.5fr_1.2fr_1fr_48px] items-center gap-6 px-5 py-3.5 rounded-2xl transition-all duration-300 border cursor-pointer relative overflow-hidden animate-slide-up",
                                            selectedUserIds.includes(user.id)
                                                ? 'bg-primary/5 border-primary shadow-m3-1 scale-[1.01] z-10'
                                                : 'bg-surface border-border hover:bg-surface-2 hover:border-primary/20 hover:shadow-teams-card'
                                        )}
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        {/* Selection indicator on left */}
                                        {selectedUserIds.includes(user.id) && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                        )}

                                        {/* Selection Checkbox */}
                                        <div className="hidden lg:flex justify-center items-center">
                                            {currentUser?.id !== user.id && (
                                                <div className={cn(
                                                    "transition-all duration-300",
                                                    selectedUserIds.includes(user.id) ? 'scale-110' : 'scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100'
                                                )}>
                                                    <div className={cn(
                                                        "rounded-lg p-1.5 border transition-all",
                                                        selectedUserIds.includes(user.id)
                                                            ? 'bg-primary text-white border-primary shadow-m3-1'
                                                            : 'bg-surface border-border text-muted-foreground'
                                                    )}>
                                                        <CheckSquare size={18} strokeWidth={2.5} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Identity */}
                                        <div
                                            className="flex items-center space-x-5 w-full min-w-0 cursor-pointer group/identity"
                                            onClick={(e) => handleViewUser(e, user)}
                                        >
                                            <div className="relative">
                                                <Avatar
                                                    src={user.avatar_url}
                                                    name={user.full_name || user.username}
                                                    size="md"
                                                    status={onlineUserIds.has(user.id) ? 'online' : 'offline'}
                                                    className="shrink-0 shadow-sm ring-4 ring-transparent group-hover/identity:ring-primary/10 transition-all duration-300"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0 gap-0.5">
                                                <div className="flex items-center space-x-2 min-w-0">
                                                    {user.rank && (
                                                        <span className="text-[9px] font-black bg-surface-3 text-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0 border border-border/50">
                                                            {user.rank}
                                                        </span>
                                                    )}
                                                    <span className="text-sm font-black text-foreground break-words leading-none group-hover/identity:text-primary transition-colors tracking-tight" title={user.full_name || user.username}>
                                                        {user.full_name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-primary opacity-80 uppercase tracking-widest leading-none">
                                                        @{user.username}
                                                    </span>
                                                    {user.position && (
                                                        <>
                                                            <div className="w-1 h-1 rounded-full bg-border" />
                                                            <span className="text-[11px] font-bold text-muted-foreground line-clamp-1 leading-none opacity-80 italic" title={user.position}>
                                                                {user.position}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meta Fields */}
                                        <div className="hidden lg:flex items-center space-x-3 min-w-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 bg-surface-3 rounded-lg flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                                                <Mail size={14} strokeWidth={2} />
                                            </div>
                                            <span className="text-xs text-foreground font-bold truncate" title={user.email}>{user.email}</span>
                                        </div>
                                        <div className="hidden lg:flex items-center space-x-3 min-w-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 bg-surface-3 rounded-lg flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                                                <Phone size={14} strokeWidth={2} />
                                            </div>
                                            <span className="text-xs text-foreground font-bold truncate">{user.phone_number || '—'}</span>
                                        </div>
                                        <div className="hidden lg:flex items-center space-x-3 min-w-0 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 bg-surface-3 rounded-lg flex items-center justify-center text-muted-foreground shrink-0 border border-border/50">
                                                <Building2 size={14} strokeWidth={2} />
                                            </div>
                                            <span className="text-xs text-foreground font-bold truncate">
                                                {user.cabinet ? t('company.cabinet_prefix', { cabinet: user.cabinet }) : '—'}
                                            </span>
                                        </div>

                                        {/* DM Button */}
                                        <div className="flex justify-center w-full lg:w-auto mt-4 lg:mt-0">
                                            {currentUser?.id !== user.id ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onStartDM(user.id);
                                                    }}
                                                    disabled={isDMPending}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl transition-all flex items-center justify-center border shadow-sm active:scale-90",
                                                        pendingDMUserId === user.id
                                                            ? 'bg-primary text-white border-primary shadow-m3-1'
                                                            : 'bg-surface-2 text-muted-foreground hover:bg-primary hover:text-white border-border hover:border-primary'
                                                    )}
                                                    title={t('users.writeMessage')}
                                                >
                                                    {isDMPending && pendingDMUserId === user.id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <MessageSquare size={18} strokeWidth={2.5} />
                                                            <span className="lg:hidden text-xs font-black ml-2 uppercase tracking-widest">{t('users.writeMessage')}</span>
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <div className="bg-surface-3 text-muted-foreground/40 w-10 h-10 rounded-xl flex items-center justify-center border border-border/50 shadow-inner">
                                                    <span className="text-[8px] font-black uppercase text-center leading-tight">{t('company.current_user_badge').split(' ').join('\n')}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </div>

            <UserProfileModal
                isOpen={!!viewingUser}
                onClose={() => setViewingUser(null)}
                user={viewingUser}
                onStartDM={onStartDM}
                currentUser={currentUser}
            />
        </div>
    );
};

export default CompanyEmployees;
