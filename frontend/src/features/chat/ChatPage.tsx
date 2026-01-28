import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, startTransition } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { Message, Channel, User } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Send, MessageSquare, Smile, X, Hash, Plus, FileText, Pencil, Users, Bell, BellOff, Info, LogOut, Download, UserPlus, Settings, Search, Phone } from 'lucide-react';
import EmojiPicker, { EmojiStyle, Theme, type EmojiClickData } from 'emoji-picker-react';

import { useTranslation } from 'react-i18next';
import { formatName } from '../../utils/formatters';

import { useToast, cn } from '../../design-system';
import MuteModal from './MuteModal';
import SearchModal from './components/SearchModal';
import ParticipantsPanel from './components/ParticipantsPanel';

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
import { MessageSkeleton, MessageList } from './components';

interface MessageInputProps {
    isConnected: boolean;
    sendMessage: (content: string | { content: string; parent_id?: number }) => void;
    updateMessage?: (id: number, content: string) => void;
    sendTyping: (is_typing: boolean) => void;
    activeThread: Message | null;
    setActiveThread: (msg: Message | null) => void;
    editingMessage?: Message | null;
    onCancelEdit?: () => void;
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
        <div className="border-t border-slate-100 bg-white p-4 z-30 shrink-0">
            <div className="relative max-w-5xl mx-auto">
                {Object.keys(typingUsers).length > 0 && (
                    <div className={`absolute bottom-full left-0 mb-2 z-50 pointer-events-none ${animations.slideIn}`}>
                        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-slate-100 flex items-center space-x-2">
                            <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {(Object.values(typingUsers) as { name: string }[]).map(u => u.name).join(', ')} {t('chat.typing')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="relative flex flex-col bg-slate-50 border border-slate-200/60 rounded-xl transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/30 overflow-hidden">
                    {editingMessage && (
                        <div className={`bg-blue-50/50 px-4 py-2 border-b border-blue-100 flex items-center justify-between ${animations.slideIn}`}>
                            <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                                <Pencil size={14} className="text-blue-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-0.5">
                                        {t('chat.editing_message')}
                                    </p>
                                    <p className="text-xs text-slate-600 truncate font-bold">
                                        {editingMessage.content}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (onCancelEdit) onCancelEdit();
                                    setInputMessage('');
                                }}
                                className="shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    {activeThread && !editingMessage && (
                        <div className={`bg-blue-50/50 px-4 py-2 border-b border-blue-100 flex items-center justify-between ${animations.slideIn}`}>
                            <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                                <div className="w-0.5 h-6 bg-blue-500 rounded-full shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-0.5">
                                        {t('chat.replying_to')} {activeThread.username}
                                    </p>
                                    <p className="text-xs text-slate-600 truncate font-bold">
                                        {activeThread.content}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActiveThread(null)}
                                className="shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-center p-1.5 space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={handleInputChange}
                            placeholder={t('chat.inputPlaceholder')}
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none font-bold text-slate-900 placeholder:text-slate-400 px-3 h-9 text-sm"
                            style={{
                                fontSize: typeof user?.preferences?.font_size === 'number'
                                    ? `${user.preferences.font_size}px`
                                    : user?.preferences?.font_size === 'small' ? '12px'
                                        : user?.preferences?.font_size === 'large' ? '18px'
                                            : '14px'
                            }}
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
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReactionTargetId(null);
                                    setShowEmojiPicker(!showEmojiPicker);
                                }}
                                icon={<Smile size={20} />}
                                className={cn("w-9 h-9 rounded-lg transition-all", showEmojiPicker ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-blue-600')}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                disabled={!inputMessage.trim() || !isConnected}
                                icon={<Send size={18} className={inputMessage.trim() && isConnected ? "translate-x-0.5" : ""} />}
                                className={cn(
                                    "w-9 h-9 rounded-lg transition-all flex items-center justify-center p-0",
                                    inputMessage.trim() && isConnected
                                        ? 'bg-blue-600 text-white shadow-sm hover:scale-105 active:scale-95'
                                        : 'bg-slate-200 text-slate-400 opacity-50'
                                )}
                            />
                        </div>
                    </form>
                </div>

                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className={`absolute bottom-full right-0 mb-4 z-[100] origin-bottom-right ${animations.zoomIn}`}>
                        <div className="shadow-xl rounded-2xl overflow-hidden border border-slate-100 bg-white">
                            <EmojiPicker
                                onEmojiClick={onEmojiClick}
                                theme={Theme.AUTO}
                                emojiStyle={EmojiStyle.GOOGLE}
                                getEmojiUrl={(unified) => `/emoji/${unified}.png`}
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
    const [typingUsers, setTypingUsers] = useState<Record<number, { name: string, timestamp: number }>>({});
    const typingTimeoutRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);
    const messageContainerRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef<number>(0);
    const isFetchingMoreRef = useRef<boolean>(false);
    const isInitialLoadRef = useRef<boolean>(true);
    const [highlightDocId, setHighlightDocId] = useState<number | null>(null);
    const [highlightMessageId] = useState<number | null>(null);
    const [showParticipants, setShowParticipants] = useState(true);
    const [activeThread, setActiveThread] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [quickReactionMessageId, setQuickReactionMessageId] = useState<number | null>(null);
    const [isMuteModalOpen, setIsMuteModalOpen] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    const muteChannelMutation = useMutation({
        mutationFn: async (duration: '1h' | '8h' | '24h' | 'forever' | null) => {
            if (!channelId) return;
            const res = await api.post(`/chat/channels/${channelId}/mute`, { duration });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channel', channelId] });
            queryClient.invalidateQueries({ queryKey: ['channels'] });
        }
    });

    const handleMute = (duration: '1h' | '8h' | '24h' | 'forever' | null) => {
        muteChannelMutation.mutate(duration);
    };

    const handleGoToMessage = (messageId: number, targetChannelId: number) => {
        if (String(targetChannelId) !== channelId) {
            navigate(`/chat/${targetChannelId}?highlightId=${messageId}`);
        } else {
            const element = document.querySelector(`[data-message-id="${messageId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('bg-blue-50');
                setTimeout(() => element.classList.remove('bg-blue-50'), 2000);
            }
        }
    };

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
            alert(t('chat.leaveChannel.ownerWarning'));
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

    const muteUntil = channel?.mute_until;
    const isMuted = muteUntil ? new Date(muteUntil) > new Date() : false;

    const [initialLastReadId, setInitialLastReadId] = useState<number | null>(null);
    const [isUnreadBannerVisible, setIsUnreadBannerVisible] = useState<boolean>(true);

    // Use ref to track current channelId to avoid race conditions in WebSocket callbacks
    // where a message from the previous channel might be processed by a stale closure
    // before the effect updates the callback ref
    const channelIdRef = useRef(channelId);
    useEffect(() => {
        channelIdRef.current = channelId;
    }, [channelId]);

    useEffect(() => {
        if (channel && channel.id === Number(channelId)) {
            // Initialize once
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setInitialLastReadId(prev => (prev === null ? channel.last_read_message_id : prev));
        }
    }, [channel, channelId]);

    // Auto-clear the "New Messages" separator after 3 seconds of being in the channel
    useEffect(() => {
        if (initialLastReadId !== null && initialLastReadId !== Number.MAX_SAFE_INTEGER && channelId) {
            const timer = setTimeout(() => {
                // First trigger the animation
                setIsUnreadBannerVisible(false);
                // Then clear the ID after animation completes (approx 500ms)
                setTimeout(() => {
                    setInitialLastReadId(Number.MAX_SAFE_INTEGER);
                }, 500);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsUnreadBannerVisible(true);
        }
    }, [initialLastReadId, channelId]);

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

        // Immediately clear unread when entering a channel (optimistic update)
        if (channelId) {
            const numChannelId = Number(channelId);
            // Clear Zustand store immediately for instant UI feedback
            clearUnread(numChannelId);
            // Also update React Query cache immediately
            queryClient.setQueryData<Channel[]>(['channels'], (old) => {
                if (!old) return old;
                return old.map(c => c.id === numChannelId ? { ...c, unread_count: 0 } : c);
            });
        }
    }, [channelId, clearUnread, queryClient]);

    // Hide participants list for system channels
    useEffect(() => {
        if (channel?.is_system && showParticipants) {
            setTimeout(() => setShowParticipants(false), 0);
        }
    }, [channel?.is_system, showParticipants]);

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

    const dmPartner = channel?.other_user;
    const isDmPartnerOnline = dmPartner?.is_online ?? false;

    const markReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/chat/channels/${id}/read`);
        },
        onSuccess: () => {
            if (channelId) {
                const numChannelId = Number(channelId);
                // Clear unread in Zustand store
                clearUnread(numChannelId);

                // Get the absolute latest message ID we have in the query cache for this channel
                const messagesData = queryClient.getQueryData<{ pages: Message[][] }>(['messages', channelId]);
                const allMessages = messagesData?.pages.flat() || [];
                const latestMsgId = allMessages.length > 0
                    ? Math.max(...allMessages.map(m => m.id))
                    : 0;

                // Update React Query cache optimistically for the channel list
                queryClient.setQueryData<Channel[]>(['channels'], (old) => {
                    if (!old) return old;
                    return old.map(c => c.id === numChannelId ? { ...c, unread_count: 0 } : c);
                });

                // Update the specific channel object's last_read_message_id
                queryClient.setQueryData<Channel>(['channel', channelId], (old) => {
                    if (!old) return old;
                    const finalId = Math.max(old.last_read_message_id || 0, latestMsgId);
                    return { ...old, last_read_message_id: finalId, unread_count: 0 };
                });
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

    // Effect to trigger mark-as-read after a short delay
    useEffect(() => {
        if (!channelId) return;

        // Trigger mutation with a short delay to ensure UI feels responsive
        // and user has time to actually see the banner
        const timer = setTimeout(() => {
            markReadMutation.mutate(Number(channelId));
        }, 500);

        return () => {
            clearTimeout(timer);
            // Synchronous update on leave/unmount if we haven't read yet
            // (Note: mutate is async but we trigger it here)
            if (channelId) {
                api.post(`/chat/channels/${channelId}/read`).catch(() => { });
            }
        };
    }, [channelId, markReadMutation]); // Only trigger on channel change

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

        console.log('🔌 Channel WS onMessage:', { type: data.type, msgChannelId, currentChannelId });

        // NOTE: We removed the early return here because it was preventing valid messages
        // from being processed. The new_message handler has its own channel check.

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

            console.log('📬 Channel WebSocket message received:', message.id, message.channel_id);

            // Prevent cross-talk: Ignore messages from other channels
            // This ensures that even if the socket receives a broadcast, we only show relevant data

            // Verify channel match (robust check)
            if (currentChannelId) {
                const msgChId = String(message.channel_id);
                const currChId = String(currentChannelId);
                if (msgChId !== currChId) {
                    console.log('⚠️ Skipping message - channel mismatch:', {
                        msgChId,
                        currChId,
                        rawMsgCh: message.channel_id,
                        rawCurrCh: currentChannelId
                    });
                    return;
                }
            }


            console.log('✅ Processing new message:', message.id, 'for channel', message.channel_id);

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
                                sender_id: message.user_id,
                                sender_name: message.full_name || message.username,
                                sender_full_name: message.full_name,
                                sender_rank: message.rank,
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

        // Files are currently handled by standard browser behavior or could be integrated with MessageInput
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
        } catch {
            // Ошибка при добавлении/удалении реакции
        }
    };

    const getHeaderIcon = () => {
        if (channel?.is_direct && channel.other_user) {
            return (
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                    <span className="text-xs font-bold uppercase">
                        {channel.other_user.full_name
                            ? channel.other_user.full_name.split(' ').map((n: string) => n[0]).join('')
                            : channel.other_user.username.slice(0, 2)
                        }
                    </span>
                </div>
            );
        }
        if (channel?.is_system) return (
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100/50">
                <Settings size={20} />
            </div>
        );
        return (
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/50">
                <Hash size={20} />
            </div>
        );
    };

    const getHeaderSubtitle = () => (
        <div className="flex items-center gap-2">
            <div className={cn(
                "w-2 h-2 rounded-full transition-all duration-500 shadow-sm",
                channel?.is_direct
                    ? (isDmPartnerOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300')
                    : (isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500')
            )} />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {channel?.is_system ? (
                    t('chat.system_channel')
                ) : channel?.is_direct ? (
                    isDmPartnerOnline ? t('chat.online') : formatLastSeen(dmPartner?.last_seen)
                ) : (
                    <>
                        <span className="text-slate-900 font-extrabold">{channel?.members_count || 0}</span> {t('common.participants', { count: channel?.members_count || 0 })}
                        {channel?.online_count ? (
                            <>
                                <span className="mx-2 opacity-30">|</span>
                                <span className="text-green-600 font-extrabold">{channel.online_count}</span> {t('chat.online')}
                            </>
                        ) : null}
                    </>
                )}
            </span>
        </div>
    );

    return (
        <div
            className="flex-1 flex flex-col h-full bg-white overflow-hidden animate-in fade-in duration-300 relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="absolute inset-0 z-[100] bg-blue-600/10 backdrop-blur-[2px] border-4 border-dashed border-blue-500/50 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 border border-slate-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center animate-bounce">
                            <Plus size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{t('chat.send_file_title')}</h3>
                            <p className="text-slate-500 font-medium">{t('chat.send_file_subtitle')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col flex-1 bg-white overflow-hidden">
                {channelId ? (
                    <>
                        {/* Unified Header */}
                        <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-40 shrink-0">
                            <div className="flex items-center gap-4 min-w-0">
                                {getHeaderIcon()}
                                <div className="min-w-0">
                                    <h1 className="font-extrabold text-slate-900 truncate leading-tight tracking-tight">
                                        {channel?.is_direct && channel.other_user
                                            ? formatName(channel.other_user.full_name, channel.other_user.username)
                                            : channel?.display_name || channel?.name || `${t('chat.channel')} ${channel?.id}`
                                        }
                                    </h1>
                                    {getHeaderSubtitle()}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setIsSearchModalOpen(true)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                                    title={t('common.search')}
                                >
                                    <Search size={20} strokeWidth={2.2} />
                                </button>

                                {!channel?.is_system && (
                                    <button
                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                                        title={t('chat.call')}
                                    >
                                        <Phone size={20} strokeWidth={2.2} />
                                    </button>
                                )}

                                {channel?.visibility === 'private' && channel?.is_member && !channel?.is_system && (
                                    <button
                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                                        title={t('chat.invite')}
                                    >
                                        <UserPlus size={20} strokeWidth={2.2} />
                                    </button>
                                )}

                                <button
                                    onClick={() => setIsMuteModalOpen(true)}
                                    className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95",
                                        isMuted
                                            ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                                    )}
                                    title={isMuted ? t('chat.notifications.unmute') : t('chat.notifications.mute')}
                                >
                                    {isMuted ? <BellOff size={20} strokeWidth={2.2} /> : <Bell size={20} strokeWidth={2.2} />}
                                </button>

                                {!channel?.is_system && (
                                    <button
                                        onClick={handleExportChat}
                                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                                        title={t('chat.export_history')}
                                    >
                                        <Download size={20} strokeWidth={2.2} />
                                    </button>
                                )}

                                <div className="w-px h-6 bg-slate-100 mx-1.5" />

                                {channel && !channel.is_direct && !channel.is_system && (
                                    <button
                                        onClick={() => setShowParticipants(!showParticipants)}
                                        className={cn(
                                            "w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-95 border",
                                            showParticipants
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:text-blue-600'
                                        )}
                                        title={t('chat.participants')}
                                    >
                                        <Users size={20} strokeWidth={2.2} />
                                    </button>
                                )}

                                <button
                                    className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-95"
                                    title={t('common.info')}
                                >
                                    <Info size={20} strokeWidth={2.2} />
                                </button>

                                {channel && !channel.is_direct && !channel.is_system && channel.is_member && !channel.is_owner && (
                                    <button
                                        onClick={handleLeaveChannel}
                                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95 ml-1"
                                        title={t('chat.leave_channel')}
                                    >
                                        <LogOut size={20} strokeWidth={2.2} />
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* Main Body */}
                        <div className="flex flex-1 overflow-hidden min-h-0 bg-white relative">
                            {/* Messages Section */}
                            <div className="flex-1 flex flex-col min-w-0 relative">
                                <div
                                    id="message-container"
                                    ref={messageContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-1 flex flex-col overflow-y-auto px-6 py-4 space-y-1 relative custom-scrollbar bg-white"
                                >
                                    {isFetchingNextPage && (
                                        <div className="flex justify-center py-2 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-white to-transparent">
                                            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                        </div>
                                    )}

                                    <div className="flex flex-col space-y-1 mt-auto">
                                        {isHistoryLoading && messages.length === 0 ? (
                                            <MessageSkeleton />
                                        ) : messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full opacity-40 animate-in fade-in duration-500 py-20">
                                                <div className="p-12 bg-slate-50 rounded-[3rem] shadow-sm border border-slate-100 mb-6">
                                                    <MessageSquare size={64} className="text-slate-300" />
                                                </div>
                                                <p className="text-xl font-bold text-slate-600">{t('chat.noMessagesYet')}</p>
                                                <p className="text-base text-slate-400 mt-2">{t('chat.beFirst')}</p>
                                            </div>
                                        ) : (
                                            <MessageList
                                                messages={messages}
                                                currentUser={user}
                                                initialLastReadId={initialLastReadId}
                                                isUnreadBannerVisible={isUnreadBannerVisible}
                                                othersReadId={channel?.others_read_id ?? undefined}
                                                highlightDocId={highlightDocId}
                                                highlightMessageId={highlightMessageId}
                                                onReply={setActiveThread}
                                                onReact={handleReactionClick}
                                                onEdit={setEditingMessage}
                                                onDelete={handleDeleteMessage}
                                                quickReactionMessageId={quickReactionMessageId}
                                                setQuickReactionMessageId={setQuickReactionMessageId}
                                                openFullEmojiPicker={(msgId) => messageInputRef.current?.openForReaction(msgId)}
                                                addToast={addToast}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Input Section */}
                                <div className="z-30 shrink-0">
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
                                            handleReactionClick={handleReactionClick}
                                            typingUsers={typingUsers}
                                        />
                                    ) : channel?.is_system ? (
                                        <div className="p-6 flex items-center justify-center bg-slate-50/50 border-t border-slate-100">
                                            <div className="text-center">
                                                <p className="text-slate-600 mb-1 font-bold text-sm">{t('chat.system_channel_readonly')}</p>
                                                <p className="text-slate-400 text-xs">{t('chat.system_channel_description')}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 flex items-center justify-center bg-blue-50/30 border-t border-blue-100/50">
                                            <div className="text-center">
                                                <p className="text-slate-600 mb-4 font-bold text-lg">{t('chat.preview_mode_message')}</p>
                                                <Button
                                                    onClick={() => joinChannelMutation.mutate()}
                                                    disabled={joinChannelMutation.isPending}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 px-8 py-3 rounded-xl text-base font-bold transition-all hover:scale-105 active:scale-95"
                                                >
                                                    {joinChannelMutation.isPending ? t('common.loading') : t('chat.join_channel')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Collapsible Participants Sidebar */}
                            {showParticipants && channelId && channel && !channel.is_direct && !channel.is_system && (
                                <aside className="w-80 border-l border-slate-100 bg-white shrink-0 overflow-hidden flex flex-col">
                                    <ParticipantsPanel
                                        channelId={Number(channelId)}
                                        onMention={handleMention}
                                        className="h-full"
                                    />
                                </aside>
                            )}
                        </div>
                    </>
                ) : (
                    /* Welcome State */
                    <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 overflow-y-auto">
                        <div className="relative mb-12 group">
                            <div className="relative">
                                <div className="w-40 h-40 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-105 transition-all duration-500 ring-8 ring-white/50 border border-slate-100">
                                    <MessageSquare className="w-20 h-20 text-blue-600" strokeWidth={1.5} />
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center border-4 border-white text-white">
                                    <Send className="w-8 h-8" />
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-4 max-w-2xl mb-16 px-4">
                            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">
                                {t('chat.welcomeTitle')}
                            </h2>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                {t('chat.welcomeDescription')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl px-4">
                            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group/tip flex flex-col items-center sm:items-start text-center sm:text-left">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover/tip:scale-110 transition-transform duration-300">
                                    <Hash size={24} />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-lg mb-2">{t('chat.welcome_tip_1_title')}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{t('chat.welcome_tip_1_desc')}</p>
                            </div>
                            <div className="p-8 rounded-2xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group/tip flex flex-col items-center sm:items-start text-center sm:text-left">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover/tip:scale-110 transition-transform duration-300">
                                    <FileText size={24} />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-lg mb-2">{t('chat.welcome_tip_2_title')}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{t('chat.welcome_tip_2_desc')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <MuteModal
                isOpen={isMuteModalOpen}
                onClose={() => setIsMuteModalOpen(false)}
                onMute={handleMute}
            />

            <SearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                onGoToMessage={handleGoToMessage}
            />
        </div>
    );
};

export default ChatPage;
