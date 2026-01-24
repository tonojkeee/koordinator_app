import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, startTransition } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { Message, Channel, User } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Send, MessageSquare, Smile, Trash2, X, Hash, Bell, Plus, Crown, Check, CheckCheck, FileText, Pencil } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react';

import SendDocumentModal from '../board/components/SendDocumentModal';
import { useTranslation } from 'react-i18next';

import ParticipantsList from './ParticipantsList';
import { Avatar, ContextMenu, type ContextMenuOption, useToast } from '../../design-system';
import MuteModal from './MuteModal';
import SearchModal from './components/SearchModal';
import TransferOwnershipModal from './components/TransferOwnershipModal';
import InviteModal from './components/InviteModal';
import ChannelHeader from './ChannelHeader';
import { formatDate, renderMessageContent } from './utils';
import { formatName } from '../../utils/formatters';

import { type Reaction } from '../../types';

// Design System imports
import { Button } from '../../design-system/components/Button';
import { animations } from '../../design-system/tokens/animations';

type WebSocketMessage =
    | { type: 'typing'; user_id: number; full_name: string; username: string; is_typing: boolean }
    | { type: 'reaction_added'; message_id: number; reaction: Reaction }
    | { type: 'reaction_removed'; user_id: number; message_id: number; emoji: string }
    | { type: 'presence'; online_count: number }
    | { type: 'message_deleted'; message_id: number }
    | { type: 'read_receipt'; channel_id: number; user_id: number; last_read_id: number }
    | { type: 'user_presence'; user_id: number; status: 'online' | 'offline' }
    | { type: 'message_updated'; id: number; channel_id: number; content: string; updated_at: string | null }
    | { type: 'member_joined'; channel_id: number; user: User }
    | { type: 'member_left'; channel_id: number; user_id: number }
    | { type: 'owner_transferred'; channel_id: number; old_owner_id: number; new_owner_id: number; new_owner_username: string; channel_owner_id: number; old_owner_username?: string }
    | { type: 'error'; message?: string; action_required?: string; channel_id?: number }
    | (Message & { type: 'new_message' })
    | (Message & { type?: never });

// Lazy load removed - using direct import
// const EmojiPickerComponent = React.lazy(() => import('emoji-picker-react'));

// Skeleton loader for messages - imported from components
import { MessageSkeleton } from './components';

interface MessageInputProps {
    isConnected: boolean;
    sendMessage: (content: string | { content: string; parent_id?: number }) => void;
    updateMessage?: (id: number, content: string) => void;
    sendTyping: (is_typing: boolean) => void;
    activeThread: Message | null;
    setActiveThread: (msg: Message | null) => void;
    editingMessage?: Message | null;
    onCancelEdit?: () => void;
    setIsSendModalOpen: (open: boolean) => void;
    handleReactionClick: (messageId: number, emoji: string) => void;
    channelId?: string;
    typingUsers?: Record<number, { name: string, timestamp: number }>;
}

export interface MessageInputHandle {
    handleMention: (username: string) => void;
    openForReaction: (msgId: number) => void;
}

const MessageInput = React.forwardRef<MessageInputHandle, MessageInputProps>((
    {
        isConnected,
        sendMessage,
        updateMessage,
        sendTyping,
        activeThread,
        setActiveThread,
        editingMessage,
        onCancelEdit,
        setIsSendModalOpen,
        handleReactionClick,
        typingUsers = {}
    }, ref) => {
    const { t } = useTranslation();
    const { user } = useAuthStore();
    const [inputMessage, setInputMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [reactionTargetId, setReactionTargetId] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingSentRef = useRef<boolean>(false);

    useEffect(() => {
        if (editingMessage) {
            const timer = setTimeout(() => {
                setInputMessage(editingMessage.content);
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [editingMessage]);

    React.useImperativeHandle(ref, () => ({
        handleMention: (username: string) => {
            setInputMessage(prev => {
                const prefix = prev.endsWith(' ') ? '' : (prev.length > 0 ? ' ' : '');
                return prev + prefix + '@' + username + ' ';
            });
            inputRef.current?.focus();
        },
        openForReaction: (msgId: number) => {
            setReactionTargetId(msgId);
            setShowEmojiPicker(true);
        }
    }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);

        if (!lastTypingSentRef.current && !editingMessage) {
            sendTyping(true);
            lastTypingSentRef.current = true;
        }

        if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);

        typingDebounceRef.current = setTimeout(() => {
            if (!editingMessage) sendTyping(false);
            lastTypingSentRef.current = false;
        }, 3000);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (inputMessage.trim() && isConnected) {
            if (editingMessage && updateMessage && onCancelEdit) {
                updateMessage(editingMessage.id, inputMessage.trim());
                onCancelEdit();
            } else if (activeThread) {
                sendMessage({ content: inputMessage.trim(), parent_id: activeThread.id });
            } else {
                sendMessage(inputMessage.trim());
            }
            setInputMessage('');
            setActiveThread(null);
            sendTyping(false);
            lastTypingSentRef.current = false;
        }
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (reactionTargetId) {
            handleReactionClick(reactionTargetId, emojiData.emoji);
            setShowEmojiPicker(false);
            setReactionTargetId(null);
        } else {
            setInputMessage(prev => prev + emojiData.emoji);
            setShowEmojiPicker(false);
            inputRef.current?.focus();
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
        handleMention: (username: string) => {
            setInputMessage(prev => {
                // If message ends with space or is empty, just append @username
                if (prev.length === 0 || prev.endsWith(' ')) {
                    return `${prev}@${username} `;
                }
                // Otherwise add a space first
                return `${prev} @${username} `;
            });
            inputRef.current?.focus();
        },
        openForReaction: (msgId: number) => {
            setReactionTargetId(msgId);
            setShowEmojiPicker(true);
        }
    }));

    return (
        <div className="px-4 md:px-8 pb-4 md:pb-6 pt-2 z-30 shrink-0">
            <div className={`relative max-w-4xl mx-auto transition-all`}>
                {Object.keys(typingUsers).length > 0 && (
                    <div className={`absolute bottom-full left-4 mb-3 z-50 pointer-events-none ${animations.slideIn}`}>
                        <div className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg shadow-indigo-500/10 border border-slate-200/50 flex items-center space-x-2.5">
                            <div className="flex space-x-1">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                                {(Object.values(typingUsers) as { name: string }[]).map(u => u.name).join(', ')} {t('chat.typing')}
                            </span>
                        </div>
                    </div>
                )}

                <div className={`relative flex flex-col bg-white/70 backdrop-blur-3xl rounded-3xl border border-white/40 shadow-xl shadow-indigo-500/10 transition-all duration-700 overflow-hidden ring-1 ring-white/50 group focus-within:shadow-2xl focus-within:shadow-indigo-500/20 focus-within:-translate-y-0.5`}>
                    {editingMessage && (
                        <div className={`bg-indigo-50/50 backdrop-blur-md px-4 py-3 border-b border-indigo-100/30 flex items-center justify-between ${animations.slideIn}`}>
                            <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                                <Pencil size={16} className="text-indigo-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider leading-none mb-1">
                                        {t('chat.editing_message')}
                                    </p>
                                    <p className="text-xs text-slate-600 truncate font-medium">
                                        {editingMessage.content}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (onCancelEdit) onCancelEdit();
                                    setInputMessage('');
                                }}
                                className="shrink-0 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white/50 rounded-lg transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {activeThread && !editingMessage && (
                        <div className={`bg-indigo-50/50 backdrop-blur-md px-4 py-3 border-b border-indigo-100/30 flex items-center justify-between ${animations.slideIn}`}>
                            <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider leading-none mb-1">
                                        {t('chat.replying_to')} {activeThread.username}
                                    </p>
                                    <p className="text-xs text-slate-600 truncate font-medium">
                                        {activeThread.content}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveThread(null)}
                                className="shrink-0 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-white/50 rounded-lg transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center p-2 md:p-2.5 space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsSendModalOpen(true)}
                            icon={<Plus size={18} />}
                            title={t('chat.send_file')}
                            className="shrink-0"
                        />

                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={handleInputChange}
                            placeholder={t('chat.inputPlaceholder')}
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400 px-2 h-10"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();

                                    const enterToSend = user?.preferences?.enter_to_send ?? true;
                                    if (enterToSend) {
                                        handleSendMessage();
                                    } else {
                                        setInputMessage(prev => prev + '\n');
                                    }
                                } else if (e.key === 'Enter' && e.shiftKey) {
                                    const enterToSend = user?.preferences?.enter_to_send ?? true;
                                    if (!enterToSend) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }
                            }}
                        />

                        <div className="flex items-center space-x-1 shrink-0">
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setReactionTargetId(null);
                                        setShowEmojiPicker(!showEmojiPicker);
                                    }}
                                    icon={<Smile size={18} />}
                                    className={showEmojiPicker ? 'text-indigo-600 bg-indigo-50' : ''}
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={!inputMessage.trim() || !isConnected}
                                icon={<Send size={18} />}
                                className={`shadow-lg ${inputMessage.trim() && isConnected
                                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700'
                                    : 'grayscale opacity-50'
                                    }`}
                            />
                        </div>
                    </form>
                </div>

                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className={`absolute bottom-full right-0 mb-4 z-[100] origin-bottom-right pr-2 ${animations.zoomIn}`}>
                        <div className="shadow-2xl shadow-indigo-500/20 rounded-[2rem] overflow-hidden border border-white/80 ring-4 ring-white/40 backdrop-blur-xl bg-white/60">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.LIGHT}
                                emojiStyle={EmojiStyle.NATIVE}
                                lazyLoadEmojis={true}
                                searchPlaceholder={t('common.search')}
                                previewConfig={{ showPreview: false }}
                                width={320}
                                height={400}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

const ChatPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { addToast } = useToast();

    const queryClient = useQueryClient();
    const { channelId } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { token, user } = useAuthStore();
    const { clearUnread } = useUnreadStore();

    const [messages, setMessages] = useState<Message[]>([]);
    const messageInputRef = useRef<{ handleMention: (username: string) => void, openForReaction: (msgId: number) => void } | null>(null);
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Record<number, { name: string, timestamp: number }>>({});
    const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFile, setDroppedFile] = useState<File | null>(null);
    const dragCounter = useRef(0);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const isFetchingMoreRef = useRef<boolean>(false);
    const isInitialLoadRef = useRef<boolean>(true);
    const [highlightDocId, setHighlightDocId] = useState<number | null>(null);
    const [highlightMessageId, setHighlightMessageId] = useState<number | null>(null);
    const [showParticipants, setShowParticipants] = useState(true);
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [activeThread, setActiveThread] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const updateMessageMutation = useMutation({
        mutationFn: async ({ id, content }: { id: number; content: string }) => {
            const res = await api.put(`/chat/messages/${id}`, { content });
            return res.data;
        },
        onSuccess: (updatedMessage) => {
            setMessages((prev) => prev.map(m =>
                m.id === updatedMessage.id
                    ? { ...m, content: updatedMessage.content, updated_at: updatedMessage.updated_at }
                    : m
            ));

            queryClient.setQueryData(['messages', channelId], (oldData: { pages: Message[][]; pageParams: number[] } | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: Message[]) =>
                        page.map(m =>
                            m.id === updatedMessage.id
                                ? { ...m, content: updatedMessage.content, updated_at: updatedMessage.updated_at }
                                : m
                        )
                    ),
                };
            });

            queryClient.setQueryData<Channel[]>(['channels'], (oldChannels) => {
                if (!oldChannels) return oldChannels;
                return oldChannels.map(ch => {
                    if (ch.id === Number(channelId) && ch.last_message && ch.last_message.id === updatedMessage.id) {
                        return {
                            ...ch,
                            last_message: {
                                ...ch.last_message,
                                content: updatedMessage.content.slice(0, 100),
                            }
                        };
                    }
                    return ch;
                });
            });
        }
    });


    const joinChannelMutation = useMutation({
        mutationFn: async () => {
            if (!channelId) return;
            const res = await api.post(`/chat/channels/${channelId}/join`);
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['channel', channelId], data);
            queryClient.invalidateQueries({ queryKey: ['channel_members', channelId] });
            queryClient.invalidateQueries({ queryKey: ['channels'] });
        }
    });

    const leaveChannelMutation = useMutation({
        mutationFn: async () => {
            if (!channelId) return;
            await api.post(`/chat/channels/${channelId}/leave`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
            navigate('/chat');
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { detail?: string } } };
            const message = err?.response?.data?.detail || t('chat.leaveChannel.error');
            alert(message);
        }
    });

    const handleLeaveChannel = () => {
        if (channel?.is_owner) {
            const result = confirm(t('chat.leaveChannel.ownerWarning'));
            if (result) {
                setShowTransferOwnershipModal(true);
            }
        } else {
            if (window.confirm(t('chat.leave_confirm') || t('chat.leaveChannel.confirm'))) {
                leaveChannelMutation.mutate();
            }
        }
    };

    const handleUpdateMessage = (id: number, content: string) => {
        updateMessageMutation.mutate({ id, content });
        setEditingMessage(null);
    };

    const handleExportChat = async () => {
        if (!channelId) return;
        try {
            const response = await api.get(`/chat/channels/${channelId}/export`, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `chat_${channelId}_export.txt`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting chat:', error);
            // Ошибка при экспорте чата
        }
    };

    const handleMention = (username: string) => {
        messageInputRef.current?.handleMention(username);
    };

    const { data: channel } = useQuery<Channel>({
        queryKey: ['channel', channelId],
        queryFn: async () => {
            if (!channelId) return null;
            const res = await api.get(`/chat/channels/${channelId}`);
            return res.data;
        },
        enabled: !!channelId,
    });

    const isMember = channel?.is_member ?? false;
    const canChat = (channel?.is_direct || isMember) && !channel?.is_system;

    const muteMutation = useMutation({
        mutationFn: async ({ channelId, muteUntil }: { channelId: number; muteUntil: string | null }) => {
            const { data } = await api.post(`/chat/channels/${channelId}/mute`, null, {
                params: { mute_until: muteUntil }
            });
            return data;
        },
        onSuccess: (_data, variables) => {
            queryClient.setQueryData(['channel', variables.channelId.toString()], (old: Channel | undefined) => {
                if (!old) return old;
                return { ...old, mute_until: variables.muteUntil };
            });
            setIsMuteModalOpen(false);
        }
    });

    const muteUntil = channel?.mute_until;
    const isMuted = React.useMemo(() => {
        if (!muteUntil) return false;
        return new Date(muteUntil) > new Date();
    }, [muteUntil]);

    const handleMute = (duration: '1h' | '8h' | '24h' | 'forever' | null) => {
        if (!channelId) return;

        let muteUntil: string | null = null;
        if (duration) {
            const date = new Date();
            switch (duration) {
                case '1h': date.setHours(date.getHours() + 1); break;
                case '8h': date.setHours(date.getHours() + 8); break;
                case '24h': date.setHours(date.getHours() + 24); break;
                case 'forever': date.setFullYear(date.getFullYear() + 100); break;
            }
            muteUntil = date.toISOString();
        }

        muteMutation.mutate({ channelId: parseInt(channelId), muteUntil });
    };

    const transferOwnershipMutation = useMutation({
        mutationFn: async (newOwnerId: number) => {
            if (!channelId) throw new Error('Channel ID is required');
            const res = await api.post(`/chat/channels/${channelId}/transfer-owner`, null, {
                params: { new_owner_id: newOwnerId }
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData<Channel>(['channel', channelId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    created_by: data.new_owner_id,
                    is_owner: data.new_owner_id === user?.id
                };
            });

            queryClient.setQueryData<Channel[]>(['channels'], (old) => {
                if (!old) return old;
                return old.map(ch => {
                    if (ch.id === Number(channelId)) {
                        return {
                            ...ch,
                            created_by: data.new_owner_id,
                            is_owner: data.new_owner_id === user?.id
                        };
                    }
                    return ch;
                });
            });

            setShowTransferOwnershipModal(false);
            alert(t('chat.transferOwnership.success'));
        },
        onError: (error: unknown) => {
            const err = error as { response?: { data?: { detail?: string } } };
            const message = err?.response?.data?.detail || t('chat.transferOwnership.error');
            alert(message);
        }
    });

    const handleTransferOwnership = (newOwnerId: number) => {
        transferOwnershipMutation.mutate(newOwnerId);
    };

    const [initialLastReadId, setInitialLastReadId] = useState<number | null>(null);

    // Use ref to track current channelId to avoid race conditions in WebSocket callbacks
    // where a message from the previous channel might be processed by a stale closure
    // before the effect updates the callback ref
    const channelIdRef = useRef(channelId);
    useEffect(() => {
        channelIdRef.current = channelId;
    }, [channelId]);

    useEffect(() => {
        if (channel && channel.id === Number(channelId)) {
            setTimeout(() => setInitialLastReadId(prev => (prev === null ? channel.last_read_message_id : prev)), 0);
        }
    }, [channel, channelId]);

    const prevChannelIdRef = useRef(channelId);
    useLayoutEffect(() => {
        if (prevChannelIdRef.current !== channelId) {
            startTransition(() => {
                setMessages([]);
                setInitialLastReadId(null);
                setActiveThread(null);
                setShowParticipants(true);
                isInitialLoadRef.current = true;
                prevChannelIdRef.current = channelId;
            });
        }
    }, [channelId]);

    // Hide participants list for system channels
    useEffect(() => {
        if (channel?.is_system && showParticipants) {
            setTimeout(() => setShowParticipants(false), 0);
        }
    }, [channel?.is_system, showParticipants]);

    const { data: members } = useQuery<User[]>({
        queryKey: ['channel_members', channelId],
        queryFn: async () => {
            if (!channelId) return [];
            const res = await api.get(`/chat/channels/${channelId}/members`);
            return res.data;
        },
        enabled: !!channelId,
    });

    const formatLastSeen = (lastSeen: string | null | undefined) => {
        if (!lastSeen) return t('chat.offline');
        const date = new Date(lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('chat.justNow');
        if (diffMins < 60) return t('chat.minsAgo', { count: diffMins });
        if (diffHours < 24) return t('chat.hoursAgo', { count: diffHours });
        if (diffDays < 7) return t('chat.daysAgo', { count: diffDays });
        return date.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US');
    };

    const highlightWords: Record<string, string[]> = {
        ru: [t('common.appName').toLowerCase().replace(/[«»]/g, ''), 'взаимодействие', 'система', 'гис'],
        en: ['coordinator', 'interaction', 'system', 'gis']
    };

    const dmPartner = channel?.other_user;
    const isDmPartnerOnline = dmPartner?.is_online ?? false;

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/chat/channels/${id}/read`);
        },
        onSuccess: () => {
            if (channelId) {
                clearUnread(Number(channelId));
                queryClient.invalidateQueries({ queryKey: ['channels'] });
                queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
            }
        }
    });

    const deleteMessageMutation = useMutation({
        mutationFn: async (messageId: number) => {
            return api.delete(`/chat/messages/${messageId}`);
        }
    });

    const handleDeleteMessage = (messageId: number) => {
        if (window.confirm(t('chat.confirm_delete'))) {
            deleteMessageMutation.mutate(messageId);
        }
    };

    const unreadCount = channel?.unread_count;
    const markAsRead = useCallback(() => {
        if (channelId && unreadCount && unreadCount > 0 && !markReadMutation.isPending) {
            markReadMutation.mutate(Number(channelId));
        }
    }, [channelId, unreadCount, markReadMutation]);

    useEffect(() => {
        if (channelId && unreadCount) {
            markAsRead();
        }
    }, [channelId, unreadCount, markAsRead]);

    const {
        data: historyData,
        isLoading: isHistoryLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ['messages', channelId],
        queryFn: async ({ pageParam = 0 }: { pageParam?: number }) => {
            if (!channelId) return [];
            const offset = (pageParam as number) * 50;
            const res = await api.get(`/chat/channels/${channelId}/messages?limit=50&offset=${offset}`);
            return res.data as Message[];
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === 50 ? allPages.length : undefined;
        },
        initialPageParam: 0,
        enabled: !!channelId,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (historyData?.pages) {
            setTimeout(() => {
                setMessages((prev) => {
                    const allHistory = historyData.pages.flat();
                    const combined = [...allHistory, ...prev];
                    const unique = Array.from(new Map(combined.map(m => [m.id, m])).values())
                        .sort((a, b) => a.id - b.id);
                    return unique;
                });
            }, 0);
        }
    }, [historyData?.pages]);

    React.useLayoutEffect(() => {
        if (isFetchingMoreRef.current && messageContainerRef.current) {
            const container = messageContainerRef.current;
            const newScrollHeight = container.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;

            if (diff > 0) {
                container.scrollTop = diff;
            }
            isFetchingMoreRef.current = false;
        }
    }, [messages.length]);

    useEffect(() => {
        if (messages.length > 0 && isInitialLoadRef.current && !searchParams.get('docId')) {
            const container = messageContainerRef.current;
            if (!container) return;

            const scrollToBottom = () => {
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            };

            scrollToBottom();

            const resizeObserver = new ResizeObserver(() => {
                if (isInitialLoadRef.current) {
                    scrollToBottom();
                }
            });
            resizeObserver.observe(container);

            const timeout = setTimeout(() => {
                scrollToBottom();
                isInitialLoadRef.current = false;
                resizeObserver.disconnect();
            }, 600);

            return () => {
                resizeObserver.disconnect();
                clearTimeout(timeout);
            };
        }
    }, [messages.length, searchParams]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;

        if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
            prevScrollHeightRef.current = container.scrollHeight;
            isFetchingMoreRef.current = true;
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        if (historyData) {
            const docId = searchParams.get('docId');
            if (docId) {
                const docIdNum = Number(docId);
                setTimeout(() => setHighlightDocId(docIdNum), 0);

                setTimeout(() => {
                    const messageElement = document.querySelector(`[data-doc-id="${docIdNum}"]`);
                    if (messageElement) {
                        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 300);

                setTimeout(() => {
                    setHighlightDocId(null);
                    setSearchParams({});
                }, 2700);
            }
        }
    }, [historyData, searchParams, setSearchParams]);

    const onMessage = useCallback((inputData: unknown) => {
        const data = inputData as WebSocketMessage;

        if (data.type === 'error') {
            addToast({
                type: 'error',
                title: t('common.error'),
                message: data.message || t('chat.send_error')
            });

            if (data.action_required === 'join_channel' && data.channel_id) {
                addToast({
                    type: 'info',
                    title: t('common.info'),
                    message: t('chat.join_channel_message'),
                    duration: 10000
                });
            }
            return;
        }

        // Use ref to check for active channel
        const currentChannelId = channelIdRef.current;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const msgChannelId = (data as any).channel_id;

        // Verify this message belongs to the currently active channel context
        if (msgChannelId && currentChannelId && Number(msgChannelId) !== Number(currentChannelId)) {
            // Ignore messages from other channels that might have leaked due to race conditions
            return;
        }

        if (data.type === 'typing') {
            const { user_id, full_name, username, is_typing } = data;
            if (user_id === user?.id) return;

            setTypingUsers(prev => {
                const newTyping = { ...prev };
                if (is_typing) {
                    newTyping[user_id] = { name: full_name || username, timestamp: Date.now() };

                    if (typingTimeoutRef.current[user_id]) {
                        clearTimeout(typingTimeoutRef.current[user_id]);
                    }

                    typingTimeoutRef.current[user_id] = setTimeout(() => {
                        setTypingUsers(p => {
                            const updated = { ...p };
                            delete updated[user_id];
                            return updated;
                        });
                    }, 5000);
                } else {
                    delete newTyping[user_id];
                    if (typingTimeoutRef.current[user_id]) {
                        clearTimeout(typingTimeoutRef.current[user_id]);
                    }
                }
                return newTyping;
            });
            return;
        }

        if (data.type === 'read_receipt') {
            if (currentChannelId && Number(currentChannelId) === data.channel_id) {
                queryClient.setQueryData<Channel>(['channel', currentChannelId], (old) => {
                    if (!old) return old;
                    const newId = Math.max(old.others_read_id || 0, data.last_read_id);
                    return { ...old, others_read_id: newId };
                });
            }
            return;
        }

        if (data.type === 'user_presence') {
            queryClient.setQueriesData({ queryKey: ['channel_members'] }, (old: unknown) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map((m: User) =>
                    m.id === data.user_id ? { ...m, is_online: data.status === 'online', last_seen: data.status === 'offline' ? new Date().toISOString() : m.last_seen } : m
                );
            });
            return;
        }

        if (data.type === 'reaction_added') {
            setMessages((prev) => prev.map(m => {
                if (m.id === data.message_id) {
                    const reactions = m.reactions || [];
                    if (reactions.some(r => r.user_id === data.reaction.user_id && r.emoji === data.reaction.emoji)) return m;
                    return { ...m, reactions: [...reactions, data.reaction] };
                }
                return m;
            }));
            return;
        }

        if (data.type === 'reaction_removed') {
            setMessages((prev) => prev.map(m => {
                if (m.id === data.message_id) {
                    return {
                        ...m,
                        reactions: (m.reactions || []).filter(r => !(r.user_id === data.user_id && r.emoji === data.emoji))
                    };
                }
                return m;
            }));
            return;
        }

        if (data.type === 'presence') {
            queryClient.setQueryData<Channel>(['channel', currentChannelId], (old) => {
                if (!old) return old;
                return { ...old, online_count: data.online_count };
            });
            return;
        }

        if (data.type === 'member_joined' || data.type === 'member_left') {
            queryClient.invalidateQueries({ queryKey: ['channel_members', currentChannelId] });
            queryClient.setQueryData<Channel>(['channel', currentChannelId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    members_count: data.type === 'member_joined'
                        ? old.members_count + 1
                        : Math.max(0, old.members_count - 1)
                };
            });
            return;
        }

        if (data.type === 'owner_transferred') {
            queryClient.setQueryData<Channel>(['channel', currentChannelId], (old) => {
                if (!old) return old;
                return {
                    ...old,
                    created_by: data.new_owner_id,
                    is_owner: data.new_owner_id === user?.id
                };
            });

            queryClient.setQueryData<Channel[]>(['channels'], (old) => {
                if (!old) return old;
                return old.map(ch => {
                    if (ch.id === Number(currentChannelId)) {
                        return {
                            ...ch,
                            created_by: data.new_owner_id,
                            is_owner: data.new_owner_id === user?.id
                        };
                    }
                    return ch;
                });
            });

            if (data.new_owner_id === user?.id) {
                alert(t('chat.transferOwnership.notification.youAreNewOwner'));
            } else if (data.old_owner_id === user?.id) {
                alert(t('chat.transferOwnership.notification.youLostOwnership'));
            } else {
                alert(t('chat.transferOwnership.notification.changed', {
                    oldOwner: data.old_owner_username || t('chat.previous_owner'),
                    newOwner: data.new_owner_username
                }));
            }

            return;
        }

        if (data.type === 'message_updated') {
            // Обновляем кэш React Query
            queryClient.setQueryData(['messages', currentChannelId], (oldData: { pages: Message[][]; pageParams: number[] } | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: Message[]) =>
                        page.map(m =>
                            m.id === data.id
                                ? { ...m, content: data.content, updated_at: data.updated_at || undefined }
                                : m
                        )
                    ),
                };
            });

            // Обновляем локальный state
            setMessages((prev) => prev.map(m => {
                if (m.id === data.id) {
                    return { ...m, content: data.content, updated_at: data.updated_at || undefined };
                }
                return m;
            }));
            return;
        }

        if (data.type === 'message_deleted') {
            // Обновляем кэш React Query
            queryClient.setQueryData(['messages', currentChannelId], (oldData: { pages: Message[][]; pageParams: number[] } | undefined) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    pages: oldData.pages.map((page: Message[]) =>
                        page.filter(m => m.id !== data.message_id)
                    ),
                };
            });

            // Обновляем локальный state
            setMessages((prev) => prev.filter(m => m.id !== data.message_id));
            return;
        }

        if (data.type === 'new_message' || !data.type) {
            const message: Message = data;

            // Prevent cross-talk: Ignore messages from other channels
            // This ensures that even if the socket receives a broadcast, we only show relevant data
            if (currentChannelId && message.channel_id !== Number(currentChannelId)) {
                return;
            }

            // Обновляем кэш React Query для сообщений
            queryClient.setQueryData(['messages', channelId], (oldData: { pages: Message[][]; pageParams: number[] } | undefined) => {
                if (!oldData) return oldData;

                // Проверяем, есть ли уже это сообщение
                const messageExists = oldData.pages.some(page =>
                    page.some(m => m.id === message.id)
                );

                if (messageExists) return oldData;

                // Добавляем сообщение в последнюю страницу
                const newPages = [...oldData.pages];
                if (newPages.length > 0) {
                    newPages[newPages.length - 1] = [...newPages[newPages.length - 1], message];
                } else {
                    newPages.push([message]);
                }

                return {
                    ...oldData,
                    pages: newPages
                };
            });

            // Обновляем локальный state для немедленного отображения
            setMessages((prev) => {
                if (prev.some(m => m.id === message.id)) return prev;
                return [...prev, message];
            });

            // Обновляем счетчик ответов для родительского сообщения
            if (message.parent_id) {
                setMessages((prev) => prev.map(m => {
                    if (m.id === message.parent_id) {
                        return { ...m, reply_count: (m.reply_count || 0) + 1 };
                    }
                    return m;
                }));
            }

            const isFromAlternativeSource = message.user_id !== user?.id;

            if (channelId && Number(channelId) === message.channel_id && isFromAlternativeSource) {
                markReadMutation.mutate(Number(channelId));
            }

            queryClient.setQueryData<Channel[]>(['channels'], (oldChannels) => {
                if (!oldChannels) return oldChannels;
                return oldChannels.map(ch => {
                    if (ch.id === message.channel_id) {
                        return {
                            ...ch,
                            last_message: {
                                id: message.id,
                                content: (message.content || '').slice(0, 100),
                                sender_name: message.full_name || message.username,
                                created_at: message.created_at,
                            }
                        };
                    }
                    return ch;
                });
            });

            setTimeout(() => {
                const container = document.getElementById('message-container');
                if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                }
            }, 10);
            return;
        }
    }, [channelId, user?.id, markReadMutation, queryClient, t, addToast]);

    const { isConnected, sendMessage, sendTyping } = useWebSocket(
        channelId ? Number(channelId) : undefined,
        token,
        { onMessage }
    );

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.types.includes('Files')) {
            dragCounter.current++;
            if (dragCounter.current === 1) {
                setIsDragging(true);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.dataTransfer.types.includes('Files')) {
            dragCounter.current--;
            if (dragCounter.current <= 0) {
                dragCounter.current = 0;
                setIsDragging(false);
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        dragCounter.current = 0;
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setDroppedFile(files[0]);
            setIsSendModalOpen(true);
        }
    };

    const handleReactionClick = async (messageId: number, emoji: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        const hasMyReaction = message.reactions?.some(r => r.user_id === user?.id && r.emoji === emoji);

        try {
            if (hasMyReaction) {
                await api.delete(`/chat/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`);
            } else {
                await api.post(`/chat/messages/${messageId}/reactions?emoji=${encodeURIComponent(emoji)}`);
            }
        } catch (error) {
            // Ошибка при добавлении/удалении реакции
        }
    };

    const groupReactions = (reactions: Reaction[]) => {
        if (!reactions) return [];
        const groups: { [emoji: string]: { emoji: string; count: number; users: string[]; avatars: (string | null)[]; hasMine: boolean } } = {};

        reactions.forEach(r => {
            if (!groups[r.emoji]) {
                groups[r.emoji] = { emoji: r.emoji, count: 0, users: [], avatars: [], hasMine: false };
            }
            groups[r.emoji].count++;
            groups[r.emoji].users.push(r.username);
            groups[r.emoji].avatars.push(r.avatar_url || null);
            if (r.user_id === user?.id) {
                groups[r.emoji].hasMine = true;
            }
        });

        return Object.values(groups);
    };

    return (
        <div
            className="flex-1 flex overflow-hidden bg-white relative animate-in fade-in duration-300"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {isDragging && (
                    <div className="absolute inset-0 z-[100] bg-indigo-600/10 backdrop-blur-[2px] border-4 border-dashed border-indigo-500/50 m-4 rounded-[2.5rem] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-8 rounded-[2rem] shadow-2xl flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center animate-bounce">
                                <Plus size={32} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">{t('chat.send_file_title')}</h3>
                                <p className="text-slate-500 font-medium">{t('chat.send_file_subtitle')}</p>
                            </div>
                        </div>
                    </div>
                )}
                {channelId ? (
                    <div className="flex-1 flex flex-col h-full transition-opacity duration-300" style={{ opacity: isHistoryLoading && messages.length === 0 ? 0.5 : 1 }}>
                        <ChannelHeader
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            channel={channel as any}
                            isConnected={isConnected}
                            isMuted={isMuted}
                            isDmPartnerOnline={isDmPartnerOnline}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            dmPartner={dmPartner as any}
                            showParticipants={showParticipants}
                            setShowParticipants={setShowParticipants}
                            setIsMuteModalOpen={setIsMuteModalOpen}
                            handleExportChat={handleExportChat}
                            onLeaveChannel={handleLeaveChannel}
                            onOpenInviteModal={() => setIsInviteModalOpen(true)}
                            formatLastSeen={formatLastSeen}
                        />

                        <SendDocumentModal
                            isOpen={isSendModalOpen}
                            onClose={() => {
                                setIsSendModalOpen(false);
                                setDroppedFile(null);
                            }}
                            recipientIds={
                                channel?.is_direct
                                    ? (channel.other_user ? [channel.other_user.id] : [])
                                    : (members || []).filter(m => m.id !== user?.id).map(m => m.id)
                            }
                            recipientNames={
                                channel?.is_direct
                                    ? (channel.other_user ? [formatName(channel.other_user.full_name, channel.other_user.username)] : [])
                                    : (members || []).filter(m => m.id !== user?.id).map(m => formatName(m.full_name, m.username))
                            }
                            channelName={!channel?.is_direct ? (channel?.display_name || channel?.name) : undefined}
                            channelId={channelId ? parseInt(channelId) : undefined}
                            preSelectedFile={droppedFile}
                        />

                        <MuteModal
                            isOpen={isMuteModalOpen}
                            onClose={() => setIsMuteModalOpen(false)}
                            onMute={handleMute}
                        />

                        <SearchModal
                            isOpen={searchModalOpen}
                            onClose={() => setSearchModalOpen(false)}
                            onGoToMessage={(messageId) => {
                                setHighlightMessageId(messageId);
                                setTimeout(() => {
                                    const el = document.getElementById(`message-${messageId}`);
                                    if (el) {
                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }, 300);
                                setTimeout(() => setHighlightMessageId(null), 3000);
                            }}
                        />

                        <TransferOwnershipModal
                            isOpen={showTransferOwnershipModal}
                            onClose={() => setShowTransferOwnershipModal(false)}
                            channelId={parseInt(channelId!)}
                            onTransfer={handleTransferOwnership}
                            currentOwnerId={channel?.created_by || 0}
                            currentUser={user}
                        />

                        <InviteModal
                            isOpen={isInviteModalOpen}
                            onClose={() => setIsInviteModalOpen(false)}
                            channelId={channelId!}
                            channelName={channel?.display_name || channel?.name || ''}
                            onInvite={async (userIds: number[], message?: string) => {
                                try {
                                    // Получаем email пользователей по их ID
                                    const usersResponse = await api.get('/auth/users');
                                    const allUsers = usersResponse.data;

                                    let successCount = 0;
                                    const errors: string[] = [];

                                    // Создаем приглашения для каждого пользователя
                                    for (const userId of userIds) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const user = allUsers.find((u: any) => u.id === userId);
                                        if (user && user.email) {
                                            try {
                                                await api.post('/chat/invitations', {
                                                    channel_id: parseInt(channelId!),
                                                    invitee_email: user.email,
                                                    role: 'member',
                                                    message: message || undefined,
                                                    expires_hours: 24
                                                });
                                                successCount++;
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            } catch (error: any) {
                                                const errorMsg = error?.response?.data?.detail || `Failed to invite ${user.full_name || user.username}`;
                                                errors.push(errorMsg);
                                            }
                                        } else {
                                            errors.push(`User with ID ${userId} not found or has no email`);
                                        }
                                    }

                                    // Показываем результат
                                    if (successCount > 0) {
                                        addToast({
                                            type: 'success',
                                            title: t('common.success'),
                                            message: t('chat.invitations_sent', { count: successCount })
                                        });
                                    }

                                    if (errors.length > 0) {
                                        addToast({
                                            type: 'error',
                                            title: t('common.error'),
                                            message: errors.join('; ')
                                        });
                                    }

                                } catch (error) {
                                    addToast({
                                        type: 'error',
                                        title: t('common.error'),
                                        message: t('chat.invite_error')
                                    });
                                    throw error;
                                }
                            }}
                        />

                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 flex flex-col min-w-0 relative">
                                <div
                                    id="message-container"
                                    ref={messageContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-1 flex flex-col overflow-y-auto px-8 py-6 space-y-1 relative"
                                >

                                    {isFetchingNextPage && (
                                        <div className="flex justify-center py-2 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-50/80 to-transparent p-2">
                                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        </div>
                                    )}

                                    <div className="flex flex-col space-y-1 mt-auto">
                                        {isHistoryLoading && messages.length === 0 ? (
                                            <MessageSkeleton />
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-[60vh] opacity-40 animate-in fade-in duration-500">
                                                <div className="p-12 bg-white rounded-[3rem] shadow-xl border border-slate-100 mb-6">
                                                    <MessageSquare size={64} className="text-slate-200" />
                                                </div>
                                                <p className="text-xl font-bold text-slate-600">{t('chat.noMessagesYet')}</p>
                                                <p className="text-base text-slate-400 mt-2">{t('chat.beFirst')}</p>
                                            </div>
                                        ) : (
                                            messages.map((msg, index) => {
                                                const isSent = msg.user_id === user?.id;
                                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;

                                                const msgDate = new Date(msg.created_at).toDateString();
                                                const prevMsgDate = prevMsg ? new Date(prevMsg.created_at).toDateString() : null;
                                                const showDateSeparator = msgDate !== prevMsgDate;

                                                const lastReadId = initialLastReadId || 0;
                                                const showUnreadSeparator = lastReadId > 0 &&
                                                    msg.id > lastReadId &&
                                                    (prevMsg ? prevMsg.id <= lastReadId : true) &&
                                                    !isSent;

                                                const isFirstInGroup = !prevMsg || prevMsg.user_id !== msg.user_id || showDateSeparator || showUnreadSeparator;
                                                const isLastInGroup = !nextMsg || nextMsg.user_id !== msg.user_id || (nextMsg && new Date(nextMsg.created_at).toDateString() !== msgDate);

                                                const msgGroupClass = isFirstInGroup && isLastInGroup ? 'msg-single' : isFirstInGroup ? 'msg-first' : isLastInGroup ? 'msg-last' : 'msg-middle';

                                                const contextOptions: ContextMenuOption[] = [
                                                    {
                                                        label: t('chat.reply'),
                                                        icon: MessageSquare,
                                                        onClick: () => setActiveThread(msg)
                                                    },
                                                    {
                                                        label: t('chat.copy_text'),
                                                        icon: FileText,
                                                        onClick: () => {
                                                            navigator.clipboard.writeText(msg.content);
                                                            addToast({ type: 'success', title: t('common.success'), message: t('chat.text_copied') });
                                                        }
                                                    }
                                                ];

                                                if (msg.user_id === user?.id || user?.role === 'admin') {
                                                    contextOptions.push({
                                                        label: t('common.edit'),
                                                        icon: Pencil,
                                                        onClick: () => setEditingMessage(msg),
                                                        divider: true
                                                    });
                                                    contextOptions.push({
                                                        label: t('common.delete'),
                                                        icon: Trash2,
                                                        variant: 'danger',
                                                        onClick: () => handleDeleteMessage(msg.id)
                                                    });
                                                }

                                                return (
                                                    <React.Fragment key={msg.id}>
                                                        {showDateSeparator && (
                                                            <div className={`date-separator ${animations.fadeIn}`}>
                                                                <span className="date-label">{formatDate(msg.created_at, t, i18n.language)}</span>
                                                            </div>
                                                        )}

                                                        {showUnreadSeparator && (
                                                            <div className={`flex items-center my-8 ${animations.fadeIn}`}>
                                                                <div className="flex-1 border-t border-rose-200/60" />
                                                                <div className="mx-4 flex items-center space-x-2 px-3 py-1 bg-rose-50/50 rounded-full border border-rose-100">
                                                                    <Bell size={12} className="text-rose-500" />
                                                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{t('chat.newMessages')}</span>
                                                                </div>
                                                                <div className="flex-1 border-t border-rose-200/60" />
                                                            </div>
                                                        )}

                                                        <div className={`${isFirstInGroup ? 'mt-7' : 'mt-[2px]'} ${animations.fadeIn}`}>
                                                            <ContextMenu options={contextOptions}>
                                                                <div className="flex items-end group flex-row gap-2 w-full">
                                                                    <div className="flex flex-col items-center shrink-0 w-10">
                                                                        {isLastInGroup ? (
                                                                            <Avatar
                                                                                src={isSent ? user?.avatar_url : msg.avatar_url}
                                                                                name={isSent ? formatName(user?.full_name || '', user?.username || '') : (msg.username ? formatName(msg.full_name, msg.username || '') : 'Система')}
                                                                                size="md"
                                                                                className="shadow-sm border border-slate-200/50 relative z-10"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-10" />
                                                                        )}
                                                                    </div>

                                                                    <div className="flex flex-col items-start min-w-0 flex-1 relative">
                                                                        {isFirstInGroup && (
                                                                            <div className="message-metadata flex-row px-1 mb-1.5">
                                                                                {!isSent && msg.rank && (
                                                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mr-0.5">
                                                                                        {msg.rank}
                                                                                    </span>
                                                                                )}
                                                                                <span className={`font-bold text-[13px] tracking-tight ${isSent ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                                                    {isSent ? t('chat.you') : (msg.username ? formatName(msg.full_name, msg.username) : 'Система')}
                                                                                </span>
                                                                                {((isSent && user?.role === 'admin') || (!isSent && msg.role === 'admin')) && (
                                                                                    <div className="text-indigo-400" title={t('admin.roleAdmin')}>
                                                                                        <Crown size={10} fill="currentColor" />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        <div
                                                                            id={`message-${msg.id}`}
                                                                            className={`message-bubble group/message relative ${isSent ? 'message-sent' : 'message-received'} ${msgGroupClass} flex flex-col ${(msg.document_id && highlightDocId === msg.document_id) || highlightMessageId === msg.id ? 'message-highlight ring-2 ring-indigo-400 shadow-lg z-10' : ''}`}
                                                                            {...(msg.document_id ? { 'data-doc-id': msg.document_id } : {})}
                                                                            style={{ fontSize: user?.preferences?.font_size === 'small' ? '0.85rem' : user?.preferences?.font_size === 'large' ? '1.1rem' : undefined }}
                                                                        >
                                                                            {msg.parent && (
                                                                                <div
                                                                                    className="reply-block"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        const el = document.getElementById(`message-${msg.parent!.id}`);
                                                                                        if (el) {
                                                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                            el.classList.add('bg-indigo-50/80');
                                                                                            el.classList.add('ring-2');
                                                                                            el.classList.add('ring-indigo-400/50');
                                                                                            setTimeout(() => {
                                                                                                el.classList.remove('bg-indigo-50/80');
                                                                                                el.classList.remove('ring-2');
                                                                                                el.classList.remove('ring-indigo-400/50');
                                                                                            }, 1500);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <span className="reply-user">{msg.parent.username}</span>
                                                                                    <span className="reply-content">{renderMessageContent(msg.parent.content, msg.parent.username === user?.username)}</span>
                                                                                </div>
                                                                            )}

                                                                            <div className="flex flex-col relative">
                                                                                {msg.content && (!msg.document_id || !msg.content.startsWith('📎')) && (
                                                                                    <div className={`leading-relaxed whitespace-pre-wrap break-words pr-14 ${isSent ? 'text-white' : 'text-slate-900'} ${msg.document_id ? 'mt-2 text-[13px] opacity-90' : ''}`}>
                                                                                        {renderMessageContent(msg.content, isSent, msg.invitation_id)}
                                                                                        {msg.updated_at && (
                                                                                            <span className={`text-[10px] ml-1 opacity-60 italic select-none ${isSent ? 'text-white' : 'text-slate-500'}`}>
                                                                                                ({t('chat.edited')})
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                )}

                                                                                <div className={`flex items-center justify-end space-x-1 self-end mt-1 -mb-1 ${isSent ? 'text-white/60' : 'text-slate-400'}`}>
                                                                                    <span className="text-[10px] tabular-nums font-medium">
                                                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                    {isSent && (
                                                                                        msg.id <= (channel?.others_read_id || 0) ? (
                                                                                            <CheckCheck size={13} className={`ml-0.5 ${isSent ? 'text-indigo-200' : 'text-indigo-500'}`} />
                                                                                        ) : (
                                                                                            <Check size={13} className="ml-0.5" />
                                                                                        )
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="absolute top-0 left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setActiveThread(msg);
                                                                                    }}
                                                                                    className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
                                                                                    title={t('chat.reply')}
                                                                                >
                                                                                    <MessageSquare size={14} />
                                                                                </button>
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        messageInputRef.current?.openForReaction(msg.id);
                                                                                    }}
                                                                                    className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
                                                                                    title={t('chat.reactions.add')}
                                                                                >
                                                                                    <Smile size={14} />
                                                                                </button>
                                                                                {(msg.user_id === user?.id || user?.role === 'admin') && (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                setEditingMessage(msg);
                                                                                            }}
                                                                                            className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90"
                                                                                            title={t('common.edit')}
                                                                                        >
                                                                                            <Pencil size={14} />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDeleteMessage(msg.id);
                                                                                            }}
                                                                                            className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-red-600 hover:border-red-200 transition-all active:scale-90"
                                                                                            title={t('common.delete')}
                                                                                        >
                                                                                            <Trash2 size={14} />
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </ContextMenu>

                                                            {msg.reactions && msg.reactions.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1 ml-12">
                                                                    {groupReactions(msg.reactions).map(group => (
                                                                        <button
                                                                            key={group.emoji}
                                                                            onClick={() => handleReactionClick(msg.id, group.emoji)}
                                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-bold transition-all backdrop-blur-sm ${group.hasMine
                                                                                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-600'
                                                                                : 'bg-white/80 text-slate-700 border border-slate-200/50 hover:bg-white hover:border-indigo-200 shadow-sm'
                                                                                }`}
                                                                            title={group.users.join(', ')}
                                                                        >
                                                                            <span className="text-base leading-none">{group.emoji}</span>
                                                                            <span className={`tabular-nums ${group.hasMine ? 'text-white' : 'text-slate-600'}`}>
                                                                                {group.count}
                                                                            </span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                {canChat ? (
                                    <MessageInput
                                        ref={messageInputRef}
                                        isConnected={isConnected}
                                        sendMessage={sendMessage}
                                        updateMessage={handleUpdateMessage}
                                        sendTyping={sendTyping}
                                        activeThread={activeThread}
                                        setActiveThread={setActiveThread}
                                        editingMessage={editingMessage}
                                        onCancelEdit={() => setEditingMessage(null)}
                                        setIsSendModalOpen={setIsSendModalOpen}
                                        handleReactionClick={handleReactionClick}
                                        typingUsers={typingUsers}
                                    />
                                ) : channel?.is_system ? (
                                    <div className="p-6 flex items-center justify-center bg-slate-50/50 backdrop-blur-xl">
                                        <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
                                            <p className="text-slate-600 mb-2 font-medium text-sm">{t('chat.system_channel_readonly')}</p>
                                            <p className="text-slate-400 text-xs">{t('chat.system_channel_description')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-6 flex items-center justify-center bg-indigo-50/50 backdrop-blur-xl">
                                        <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
                                            <p className="text-slate-600 mb-4 font-bold text-lg">{t('chat.preview_mode_message')}</p>
                                            <Button
                                                onClick={() => joinChannelMutation.mutate()}
                                                disabled={joinChannelMutation.isPending}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 px-8 py-3 rounded-xl text-base font-bold transition-all hover:scale-105 active:scale-95"
                                            >
                                                {joinChannelMutation.isPending ? t('common.loading') : t('chat.join_channel')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {showParticipants && channelId && channel && !channel.is_direct && !channel.is_system && (
                                <ParticipantsList
                                    channelId={Number(channelId)}
                                    onMention={handleMention}
                                    className="w-80 shrink-0 transition-all duration-300"
                                />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center animate-in bg-gradient-to-br from-indigo-50/20 via-white to-purple-50/20 backdrop-blur-3xl p-8 overflow-y-auto">
                        <div className="relative mb-16 group">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full scale-150 animate-pulse pointer-events-none" />
                            <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full scale-110 animate-pulse [animation-delay:-2s] pointer-events-none" />

                            <div className="relative">
                                <div className="w-52 h-52 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-600 rounded-3xl shadow-[0_32px_80px_-16px_rgba(79,70,229,0.4)] flex items-center justify-center group-hover:scale-105 group-hover:-rotate-3 transition-all duration-1000 ring-4 ring-white/10">
                                    <MessageSquare className="w-24 h-24 text-white drop-shadow-2xl" />
                                </div>
                                <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-700 delay-100 ring-4 ring-indigo-50/50">
                                    <div className="w-18 h-18 bg-indigo-50 rounded-3xl flex items-center justify-center">
                                        <Send className="w-10 h-10 text-indigo-600 animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-8 max-w-3xl mb-20 px-4">
                            <h2 className="text-6xl md:text-7xl font-black tracking-tighter text-slate-900 leading-[0.95] [text-wrap:balance]">
                                {t('chat.welcomeTitle').split(' ').map((word, i, arr) => (
                                    <React.Fragment key={i}>
                                        {highlightWords[i18n.language as keyof typeof highlightWords]?.includes(word.toLowerCase().replace(/[«»]/g, '')) ? (
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 drop-shadow-sm">
                                                {word}
                                            </span>
                                        ) : word}
                                        {i < arr.length - 1 ? ' ' : ''}
                                    </React.Fragment>
                                ))}
                            </h2>
                            <p className="text-xl text-slate-500 font-bold leading-relaxed max-w-xl mx-auto opacity-70">
                                {t('chat.welcomeDescription')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-3xl px-4 animate-in delay-500">
                            <div className="p-10 rounded-3xl bg-white/40 border border-white shadow-2xl shadow-indigo-500/5 backdrop-blur-3xl hover:bg-white hover:scale-[1.02] hover:-translate-y-1 hover:shadow-indigo-500/10 transition-all duration-700 group/tip flex flex-col items-center sm:items-start text-center sm:text-left ring-1 ring-white/50">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover/tip:scale-110 group-hover/tip:rotate-6 transition-transform duration-700 shadow-sm border border-indigo-100/50">
                                    <Hash size={32} />
                                </div>
                                <h3 className="font-black text-slate-900 text-xl mb-3 tracking-tight">{t('chat.welcome_tip_1_title')}</h3>
                                <p className="text-base text-slate-400 font-bold leading-relaxed">{t('chat.welcome_tip_1_desc')}</p>
                            </div>
                            <div className="p-10 rounded-3xl bg-white/40 border border-white shadow-2xl shadow-purple-500/5 backdrop-blur-3xl hover:bg-white hover:scale-[1.02] hover:-translate-y-1 hover:shadow-purple-500/10 transition-all duration-700 group/tip flex flex-col items-center sm:items-start text-center sm:text-left ring-1 ring-white/50">
                                <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover/tip:scale-110 group-hover/tip:-rotate-6 transition-transform duration-700 shadow-sm border border-purple-100/50">
                                    <FileText size={32} />
                                </div>
                                <h3 className="font-black text-slate-900 text-xl mb-3 tracking-tight">{t('chat.welcome_tip_2_title')}</h3>
                                <p className="text-base text-slate-400 font-bold leading-relaxed">{t('chat.welcome_tip_2_desc')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
