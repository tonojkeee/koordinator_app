import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { Avatar, cn } from '../../../design-system';
import { Loader2, Search, MessageSquare, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { abbreviateRank, formatName } from '../../../utils/formatters';
import OwnerIndicator from './OwnerIndicator';

interface UserBasicInfo {
    id: number;
    username: string;
    full_name?: string;
    avatar_url?: string;
    role?: string;
    rank?: string;
    is_online?: boolean;
    last_seen?: string;
    is_owner?: boolean;
}

interface ParticipantsPanelProps {
    channelId: number;
    onMention: (username: string) => void;
    className?: string;
}

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ channelId, onMention, className = '' }) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
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
        e.stopPropagation();
        createDmMutation.mutate(targetUserId);
    };

    const filteredMembers = useMemo(() => {
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
            <div className={cn("flex flex-col items-center justify-center h-full animate-in fade-in duration-500", className)}>
                <Loader2 className="animate-spin text-blue-500 mb-4" size={24} />
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full bg-transparent overflow-hidden", className)}>
            {/* Header section with count and search */}
            <div className="p-4 space-y-4 shrink-0">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users size={14} className="opacity-60" />
                        {t('chat.participants')}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-extrabold border border-blue-100/50">
                        {members?.length || 0}
                    </span>
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-slate-100/50 hover:bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredMembers.map((member) => (
                    <div
                        key={member.id}
                        onClick={() => onMention(member.username)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all duration-200 group cursor-pointer active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar
                                src={member.avatar_url}
                                name={member.full_name || member.username}
                                size="xs"
                                status={member.is_online ? 'online' : undefined}
                                className="shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                                    {member.rank && (
                                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase tracking-tighter shrink-0">
                                            {abbreviateRank(member.rank)}
                                        </span>
                                    )}
                                    <span className="truncate">{formatName(member.full_name, member.username)}</span>
                                    {member.is_owner && (
                                        <OwnerIndicator size="xs" className="shrink-0" />
                                    )}
                                </span>
                                {!member.is_online && member.last_seen && (
                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                                        {(() => {
                                            try {
                                                const isoStr = member.last_seen.includes('Z') ? member.last_seen : `${member.last_seen}Z`;
                                                const lastSeenDate = new Date(isoStr);
                                                const today = new Date();
                                                return lastSeenDate.toLocaleDateString() === today.toLocaleDateString()
                                                    ? lastSeenDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : lastSeenDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
                                            } catch (error) {
                                                return '';
                                            }
                                        })()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {member.id !== user?.id && (
                            <button
                                onClick={(e) => handleMessage(e, member.id)}
                                disabled={createDmMutation.isPending}
                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                                title={t('chat.sendMessage')}
                            >
                                <MessageSquare size={14} />
                            </button>
                        )}
                    </div>
                ))}

                {filteredMembers.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{t('common.noResults')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ParticipantsPanel);
