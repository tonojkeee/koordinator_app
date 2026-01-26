import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Avatar } from '../../design-system';
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
            <div className={`flex flex-col items-center justify-center p-8 h-full ${className}`}>
                <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                <p className="text-xs text-slate-400">{t('common.loading')}</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-white border-l border-[#E0E0E0] ${className}`}>
            <div className="p-4 border-b border-[#E0E0E0]">
                <h3 className="text-xs font-bold text-[#616161] uppercase tracking-wide mb-3 flex items-center justify-between">
                    {t('chat.selectUsers')}
                    <span className="px-1.5 py-0.5 bg-[#F0F0F0] text-[#616161] rounded text-[10px] font-bold">{members?.length || 0}</span>
                </h3>
                <div className="relative group">
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 bg-[#F5F5F5] border border-transparent rounded-md text-sm focus:outline-none focus:bg-white focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] transition-all placeholder:text-[#888888] text-[#242424]"
                    />
                    <Search className="absolute left-3 top-2.5 text-[#888888] group-focus-within:text-[#5B5FC7] transition-colors" size={14} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                {filteredMembers.map(member => (
                    <div
                        key={member.id}
                        onClick={() => onMention(member.username)}
                        className="w-full flex items-center justify-between p-2 rounded-md hover:bg-[#F5F5F5] transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center space-x-3 min-w-0">
                            <div className="relative">
                                <Avatar
                                    src={member.avatar_url}
                                    name={member.full_name || member.username}
                                    size="sm"
                                    status={member.is_online ? 'online' : undefined}
                                    className="shrink-0"
                                />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-[13px] font-semibold text-[#242424] group-hover:text-[#5B5FC7] transition-colors flex items-center truncate">
                                    {member.rank && <span className="text-[#616161] mr-1.5 text-[10px] font-bold">{abbreviateRank(member.rank)}</span>}
                                    <span className="truncate">{formatName(member.full_name, member.username)}</span>
                                    {member.is_owner && (
                                        <OwnerIndicator size="sm" className="ml-1.5" />
                                    )}
                                </span>
                                <div className="flex items-center space-x-2 min-w-0">
                                    {member.is_online ? (
                                        <span className="text-[10px] text-green-600 font-medium">{t('chat.online')}</span>
                                    ) : member.last_seen ? (
                                        <span className="text-[10px] text-[#888888] truncate">
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
                                        <span className="text-[10px] text-[#888888]">{t('chat.offline')}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {member.id !== user?.id && (
                            <button
                                onClick={(e) => handleMessage(e, member.id)}
                                disabled={createDmMutation.isPending}
                                className="w-8 h-8 flex items-center justify-center text-[#888888] hover:text-[#5B5FC7] hover:bg-white rounded-md transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-[#E0E0E0] shadow-sm"
                                title={t('chat.sendMessage')}
                            >
                                <MessageSquare size={16} strokeWidth={1.5} />
                            </button>
                        )}
                    </div>
                ))}

                {filteredMembers.length === 0 && (
                    <div className="p-8 text-center flex flex-col items-center opacity-60">
                        <Search size={24} className="text-[#BDBDBD] mb-2" />
                        <p className="text-[#888888] text-xs">{t('common.noResults')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ParticipantsList);
