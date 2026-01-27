import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import api from '../../../api/client';
import { Modal, Input, Avatar } from '../../../design-system';
import { formatDate } from '../utils';
import type { Message } from '../../../types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToMessage: (messageId: number, channelId: number) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onGoToMessage }) => {
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: messages, isLoading } = useQuery<Message[]>({
        queryKey: ['search_messages', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 3) return [];
            const res = await api.get(`/chat/search?q=${encodeURIComponent(debouncedQuery)}`);
            return res.data;
        },
        enabled: debouncedQuery.length >= 3,
    });

    const handleClose = () => {
        setQuery('');
        setDebouncedQuery('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center gap-2">
                    <Search size={20} className="text-[#5B5FC7]" />
                    <span>{t('chat.search_messages')}</span>
                </div>
            }
            size="lg"
        >
            <div className="space-y-6">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('chat.search_placeholder')}
                    leftIcon={<Search size={18} />}
                    autoFocus
                    fullWidth
                />

                <div className="max-h-[60vh] overflow-y-auto space-y-2 custom-scrollbar">
                    {isLoading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-[#5B5FC7]" size={32} />
                        </div>
                    )}

                    {!isLoading && messages?.length === 0 && debouncedQuery.length >= 3 && (
                        <div className="text-center py-8 text-[#888888]">
                            {t('chat.no_results')}
                        </div>
                    )}

                    {!isLoading && messages?.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => {
                                onGoToMessage(msg.id, msg.channel_id);
                                handleClose();
                            }}
                            className="p-3 rounded-md border border-transparent hover:bg-[#F5F5F5] hover:border-[#E0E0E0] cursor-pointer transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <Avatar
                                    src={msg.avatar_url}
                                    name={msg.full_name || msg.username || '?'}
                                    size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-sm text-[#242424]">
                                            {msg.full_name || msg.username}
                                        </span>
                                        <span className="text-xs text-[#888888]">
                                            {formatDate(msg.created_at, t, i18n.language)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#424242] line-clamp-2">
                                        {msg.content}
                                    </p>
                                    {msg.document_id && (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-[#5B5FC7] bg-[#EEF2FF] w-fit px-2 py-0.5 rounded">
                                            <FileText size={12} />
                                            {msg.document_title || 'Document'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

export default SearchModal;
