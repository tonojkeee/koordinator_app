import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Avatar, cn } from '../../design-system';
import { Loader2, Search, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { abbreviateRank, formatName } from '../../utils/formatters';
import OwnerIndicator from './components/OwnerIndicator';

interface UserBasicInfo {
    id: number;
    username: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
    rank?: string;
    is_online?: boolean;
    last_seen?: string;
    is_owner?: boolean; // Добавляем поле для указания владельца
}

interface ParticipantsListProps {
    channelId: number;
    onMention: (username: string) => void;
    className?: string;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({ channelId, onMention, className = '' }) => {
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: members, isLoading } = useQuery<UserBasicInfo[]>({
        queryKey: ['channel_members', String(channelId)],
        queryFn: async () => {
            const res = await api.get(`/chat/channels/${channelId}/members`);
            return res.data;
        },
        enabled: !!channelId,
    });

    const createDmMutation = useMutation({
        mutationFn: async (targetUserId: number) => {
            const res = await api.post(`/chat/direct/${targetUserId}`);
            return res.data;
        },
        onSuccess: (channel) => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            navigate(`/chat/${channel.id}`);
        },
    });

    const handleMessage = (e: React.MouseEvent, targetUserId: number) => {
        e.stopPropagation(); // Prevent onMention from triggering if we wrap the row
        createDmMutation.mutate(targetUserId);
    };

    const filteredMembers = React.useMemo(() => {
        if (!members) return [];
        if (!search.trim()) return members;
        const lowerSearch = search.toLowerCase();
        return members.filter(m =>
            m.username.toLowerCase().includes(lowerSearch) ||
            (m.full_name && m.full_name.toLowerCase().includes(lowerSearch))
        );
    }, [members, search]);

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-10 h-full bg-surface-1/50 animate-fade-in", className)}>
                <Loader2 className="animate-spin text-primary mb-4" size={32} strokeWidth={3} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full bg-surface border-l border-border shadow-sm animate-in slide-in-from-right duration-500", className)}>
            <div className="p-5 border-b border-border/60 bg-surface-1/30">
                <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 flex items-center justify-between px-1 opacity-80">
                    {t('chat.selectUsers')}
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-black shadow-sm border border-primary/5">{members?.length || 0}</span>
                </h3>
                <div className="relative group">
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 bg-surface-2 border border-border/50 rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/40 shadow-inner"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={15} strokeWidth={2.5} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-surface/50">
                {filteredMembers.map((member, index) => (
                    <div
                        key={member.id}
                        onClick={() => onMention(member.username)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-2 border border-transparent hover:border-border/40 transition-all duration-300 group cursor-pointer active:scale-[0.98] animate-slide-up"
                        style={{ animationDelay: `${index * 20}ms` }}
                    >
                        <div className="flex items-center space-x-4 min-w-0">
                            <div className="relative">
                                <Avatar
                                    src={member.avatar_url}
                                    name={member.full_name || member.username}
                                    size="sm"
                                    status={member.is_online ? 'online' : undefined}
                                    className="shrink-0 shadow-sm ring-2 ring-transparent group-hover:ring-primary/10 transition-all duration-500"
                                />
                            </div>
                            <div className="flex flex-col min-w-0 gap-0.5">
                                <span className="text-[13px] font-black text-foreground group-hover:text-primary transition-colors flex items-center truncate tracking-tight">
                                    {member.rank && <span className="text-[9px] font-black bg-surface-3 text-muted-foreground px-1.5 py-0.5 rounded uppercase tracking-widest mr-2 opacity-80 border border-border/50">{abbreviateRank(member.rank)}</span>}
                                    <span className="truncate">{formatName(member.full_name, member.username)}</span>
                                    {member.is_owner && (
                                        <OwnerIndicator size="sm" className="ml-2 shadow-sm" />
                                    )}
                                </span>
                                <div className="flex items-center space-x-2 min-w-0">
                                    {member.is_online ? (
                                        <span className="text-[9px] text-green-600 font-black uppercase tracking-widest flex items-center gap-1.5">
                                            <div className="w-1 h-1 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                                            {t('chat.online')}
                                        </span>
                                    ) : member.last_seen ? (
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60 truncate">
                                            {(() => {
                                                try {
                                                    const isoStr = member.last_seen.includes('Z') ? member.last_seen : `${member.last_seen}Z`;
                                                    const lastSeenDate = new Date(isoStr);
                                                    const today = new Date();
                                                    return lastSeenDate.toLocaleDateString() === today.toLocaleDateString()
                                                        ? lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                                } catch (error) {
                                                    console.error('Error parsing date:', error);
                                                    return member.last_seen;
                                                }
                                            })()}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{t('chat.offline')}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {member.id !== user?.id && (
                            <button
                                onClick={(e) => handleMessage(e, member.id)}
                                disabled={createDmMutation.isPending}
                                className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-surface border border-transparent hover:border-border transition-all opacity-0 group-hover:opacity-100 rounded-xl shadow-sm active:scale-90"
                                title={t('chat.sendMessage')}
                            >
                                <MessageSquare size={16} strokeWidth={2.5} />
                            </button>
                        )}
                    </div>
                ))}

                {filteredMembers.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center animate-scale-in">
                        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Search size={24} className="text-muted-foreground/20" strokeWidth={1} />
                        </div>
                        <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] opacity-50">{t('common.noResults')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ParticipantsList);
