import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { Avatar, cn } from '../../../design-system';
import { Loader2, Search, MessageSquare, Users, ChevronDown, ChevronRight, Shield, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { abbreviateRank, formatName } from '../../../utils/formatters';

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

interface SectionHeaderProps {
    title: string;
    count: number;
    expanded: boolean;
    onToggle: () => void;
}

const SectionHeader = ({ title, count, expanded, onToggle }: SectionHeaderProps) => (
    <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors group"
    >
        <div className="flex items-center gap-1.5">
            <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                {expanded ? <ChevronDown size={12} strokeWidth={2.5} /> : <ChevronRight size={12} strokeWidth={2.5} />}
            </div>
            <span>{title}</span>
        </div>
        <span className="text-[10px] tabular-nums opacity-60 font-medium">{count}</span>
    </button>
);

const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({ channelId, onMention, className = '' }) => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();

    // Group visibility state
    const [sections, setSections] = useState({
        online: true,
        offline: true
    });

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

    const toggleSection = (section: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const groupedMembers = useMemo(() => {
        if (!members) return { online: [], offline: [] };

        let filtered = members;
        if (search.trim()) {
            const lowerSearch = search.toLowerCase();
            filtered = members.filter(m =>
                m.username.toLowerCase().includes(lowerSearch) ||
                (m.full_name && m.full_name.toLowerCase().includes(lowerSearch))
            );
        }

        // Sort: Owner -> Admin -> Rank -> Name
        const sorter = (a: UserBasicInfo, b: UserBasicInfo) => {
            if (a.is_owner !== b.is_owner) return (b.is_owner ? 1 : 0) - (a.is_owner ? 1 : 0);
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (b.role === 'admin' && a.role !== 'admin') return 1;
            // Fallback to name
            const nameA = a.full_name || a.username;
            const nameB = b.full_name || b.username;
            return nameA.localeCompare(nameB);
        };

        const sorted = [...filtered].sort(sorter);

        return {
            online: sorted.filter(m => m.is_online),
            offline: sorted.filter(m => !m.is_online)
        };
    }, [members, search]);

    if (isLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center h-full animate-in fade-in duration-500", className)}>
                <Loader2 className="animate-spin text-blue-500 mb-4" size={24} />
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{t('common.loading')}</p>
            </div>
        );
    }

    const renderMemberItem = (member: UserBasicInfo) => (
        <div
            key={member.id}
            onClick={() => onMention(member.username)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all duration-200 group cursor-pointer"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                    <Avatar
                        src={member.avatar_url}
                        name={member.full_name || member.username}
                        size="xs"
                        className="shrink-0"
                    />
                    {member.is_online ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    ) : (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-300 border-2 border-white rounded-full" />
                    )}
                </div>

                <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-medium text-slate-900 truncate">
                            {formatName(member.full_name, member.username)}
                        </span>

                        {member.rank && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                                {abbreviateRank(member.rank)}
                            </span>
                        )}
                    </div>

                    {/* Optional Status/Last Seen Text if needed, or Role Badge */}
                    {/* For dense layout, we can put Admin/Owner badge here or on the right */}
                </div>
            </div>

            <div className="flex items-center gap-1">
                {member.is_owner && (
                    <Crown size={12} className="text-amber-500 shrink-0" fill="currentColor" />
                )}
                {member.role === 'admin' && !member.is_owner && (
                    <Shield size={12} className="text-blue-500 shrink-0" fill="currentColor" />
                )}

                {member.id !== user?.id && (
                    <button
                        onClick={(e) => handleMessage(e, member.id)}
                        disabled={createDmMutation.isPending}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all opacity-0 group-hover:opacity-100"
                        title={t('chat.sendMessage')}
                    >
                        <MessageSquare size={12} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className={cn("flex flex-col h-full bg-white border-l border-slate-200 w-64", className)}>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        {t('chat.participants')}
                    </h3>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums">
                        {members?.length || 0}
                    </span>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {/* Online Section */}
                {groupedMembers.online.length > 0 && (
                    <div className="mb-2">
                        <SectionHeader
                            title={t('chat.status.online')}
                            count={groupedMembers.online.length}
                            expanded={sections.online}
                            onToggle={() => toggleSection('online')}
                        />
                        {sections.online && (
                            <div className="mt-1">
                                {groupedMembers.online.map(renderMemberItem)}
                            </div>
                        )}
                    </div>
                )}

                {/* Offline Section */}
                {groupedMembers.offline.length > 0 && (
                    <div className="mb-2">
                        <SectionHeader
                            title={t('chat.status.offline')}
                            count={groupedMembers.offline.length}
                            expanded={sections.offline}
                            onToggle={() => toggleSection('offline')}
                        />
                        {sections.offline && (
                            <div className="mt-1">
                                {groupedMembers.offline.map(renderMemberItem)}
                            </div>
                        )}
                    </div>
                )}

                {members && members.length === 0 && (
                    <div className="py-12 text-center">
                        <Users size={24} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-400 font-medium text-xs">{t('common.noResults')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ParticipantsPanel);
