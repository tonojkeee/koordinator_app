import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2, FileText } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { Avatar } from '../../../design-system';
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

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-center justify-between mb-4">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
                                        <Search size={20} className="text-indigo-600" />
                                        {t('chat.search_messages')}
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="relative mb-6">
                                    <input
                                        type="text"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder={t('chat.search_placeholder')}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoFocus
                                    />
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto space-y-3">
                                    {isLoading && (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                                        </div>
                                    )}

                                    {!isLoading && messages?.length === 0 && debouncedQuery.length >= 3 && (
                                        <div className="text-center py-8 text-gray-500">
                                            {t('chat.no_results')}
                                        </div>
                                    )}

                                    {!isLoading && messages?.map((msg) => (
                                        <div
                                            key={msg.id}
                                            onClick={() => {
                                                onGoToMessage(msg.id, msg.channel_id);
                                                onClose();
                                            }}
                                            className="p-3 rounded-xl border border-gray-100 hover:bg-indigo-50 hover:border-indigo-100 cursor-pointer transition-all group"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar
                                                    src={msg.avatar_url}
                                                    name={msg.full_name || msg.username || '?'}
                                                    className="w-8 h-8"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-sm text-gray-900">
                                                            {msg.full_name || msg.username}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {formatDate(msg.created_at, t, i18n.language)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                        {msg.content}
                                                    </p>
                                                    {msg.document_id && (
                                                        <div className="mt-1 flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded">
                                                            <FileText size={12} />
                                                            {msg.document_title || 'Document'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default SearchModal;
