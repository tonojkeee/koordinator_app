import React, { useCallback, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTasksIssued } from '../../features/tasks/tasksApi';
import { useGlobalWebSocket } from '../../hooks/useGlobalWebSocket';
import { useToast } from '../../design-system';
import api from '../../api/client';
import type { Channel } from '../../types';
import { useTranslation } from 'react-i18next';
import { playNotificationSound } from '../../utils/sound';
import DocumentViewer from '../../features/board/components/DocumentViewer';
import { useDocumentViewer } from '../../features/board/store/useDocumentViewer';
import { sendSystemNotification } from '../../services/notificationService';
import { SidebarNav } from './SidebarNav';

const MainLayout: React.FC = () => {
    const { t } = useTranslation();
    const { user, token } = useAuthStore();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const openViewer = useDocumentViewer(state => state.open);
    const { addUnread, syncUnreads, addDocUnread, clearDocUnread, setTasksUnread, setTasksReview, setEmailsUnread, incrementEmailsUnread } = useUnreadStore();
    const { isConnected, isOffline } = useConnectionStore();

    const getFullUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const baseUrl = (import.meta.env.VITE_API_URL || api.defaults.baseURL || '').replace('/api', '');
        return `${baseUrl}${path}`;
    };

    // Fetch channels to get initial unread counts
    const { data: channels } = useQuery<Channel[]>({
        queryKey: ['channels'],
        queryFn: async () => {
            const res = await api.get('/chat/channels');
            return res.data;
        },
        enabled: !!token,
    });

    // Sync backend unread counts to store, but preserve optimistic updates for current channel
    useEffect(() => {
        if (channels && Array.isArray(channels)) {
            // Extract current channel ID from path
            const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
            const currentChannelIdNum = currentChannelId ? Number(currentChannelId) : null;

            const counts: Record<number, number> = {};
            channels.forEach(c => {
                // Don't overwrite current channel's unread - let optimistic update persist
                if (currentChannelIdNum && c.id === currentChannelIdNum) {
                    counts[c.id] = 0; // User is viewing this channel, so it's read
                } else {
                    counts[c.id] = c.unread_count;
                }
            });
            syncUnreads(counts);
        }
    }, [channels, syncUnreads, location.pathname]);

    // Clear document unread when visiting the board
    useEffect(() => {
        if (location.pathname === '/board') {
            clearDocUnread();
        }
    }, [location.pathname, clearDocUnread]);

    // Fetch received tasks for badge count
    const { data: tasks } = useQuery<unknown[]>({
        queryKey: ['tasks', 'received'],
        queryFn: async () => {
            const res = await api.get('/tasks/received');
            return res.data;
        },
        enabled: !!token,
    });

    // Update unread count based on active tasks
    useEffect(() => {
        if (Array.isArray(tasks)) {
            // Count active tasks (IN_PROGRESS, OVERDUE)
            const activeCount = (tasks as { status: string }[]).filter((t) =>
                t.status === 'in_progress' || t.status === 'overdue'
            ).length;
            setTasksUnread(activeCount);
        }
    }, [tasks, setTasksUnread]);



    // We need to fetch ISSUED tasks to know how many are on review
    const { data: issuedTasks } = useTasksIssued();

    useEffect(() => {
        if (Array.isArray(issuedTasks)) {
            const reviews = issuedTasks.filter(t => t.status === 'on_review').length;
            setTasksReview(reviews);
        }
    }, [issuedTasks, setTasksReview]);

    // Fetch initial email unread count
    useEffect(() => {
        const fetchEmailUnread = async () => {
            try {
                const res = await api.get('/email/unread-count');
                setEmailsUnread(res.data.total);
            } catch (err) {
                console.error('Failed to fetch initial email unread count', err);
            }
        };
        if (token) {
            fetchEmailUnread();
        }
    }, [token, setEmailsUnread]);

    const onChannelCreated = useCallback((data: unknown) => {
        const { channel } = data as { channel: Channel };
        queryClient.invalidateQueries({ queryKey: ['channels'] });
        if (channel && !channel.is_direct) {
            addToast({
                type: 'success',
                title: t('chat.new_space'),
                message: t('chat.new_space_created', { name: channel.display_name || channel.name }),
                duration: 4000
            });

            if (user?.notify_browser) {
                sendSystemNotification(t('chat.new_space'), {
                    body: t('chat.new_space_created', { name: channel.display_name || channel.name }),
                    icon: '/icon.png',
                    tag: `channel-${channel.id}`,
                });
            }
        }
    }, [queryClient, addToast, user?.notify_browser, t]);

    const onMessageReceived = useCallback((data: unknown) => {
        const msgData = data as {
            channel_id: number;
            is_mentioned?: boolean;
            type?: string;
            message?: {
                id?: number;
                document_id?: number;
                sender_name?: string;
                sender_full_name?: string | null;
                sender_rank?: string | null;
                sender_id?: number;
                content?: string;
                created_at?: string;
                avatar_url?: string | null;
            };
        };

        console.log('📬 Global WebSocket message received:', msgData.type, msgData.channel_id);
        // Ensure channelId is a number
        const channelId = Number(msgData.channel_id);
        const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
        const currentChannelIdNum = currentChannelId ? Number(currentChannelId) : null;

        // Strict comparison
        if (!currentChannelIdNum || currentChannelIdNum !== channelId) {
            const isSelf = msgData.message?.sender_id === user?.id;

            if (!isSelf) {
                addUnread(channelId);

                const currentChannels = queryClient.getQueryData<Channel[]>(['channels']);
                const channel = Array.isArray(currentChannels) ? currentChannels.find(c => c.id === channelId) : undefined;
                const isMuted = channel?.mute_until ? new Date(channel.mute_until) > new Date() : false;

                if (user?.notify_sound && !isMuted) {
                    playNotificationSound();
                }

                const shouldNotify = user?.notify_browser !== false;
                const isDocumentShare = !!msgData.message?.document_id;

                if (isDocumentShare && msgData.message?.document_id) {
                    addDocUnread(msgData.message.document_id, channelId);
                }

                if (shouldNotify && !isDocumentShare && !isMuted) {
                    const senderName = msgData.message?.sender_name || t('common.someone');
                    const content = msgData.message?.content || t('chat.new_message_default');
                    const isMentioned = msgData.is_mentioned;

                    const title = isMentioned
                        ? t('chat.mentioned_by', { name: senderName })
                        : senderName;

                    if (isMentioned) {
                        addToast({
                            type: 'info',
                            title: title,
                            message: content,
                            duration: 5000,
                            onClick: () => navigate(`/chat/${channelId}`)
                        });
                    }

                    const senderRank = msgData.message?.sender_rank;
                    const senderFullName = msgData.message?.sender_full_name || senderName;
                    const displaySender = senderRank ? `${senderRank} ${senderFullName}` : senderFullName;
                    const channelName = channel?.display_name || channel?.name;
                    const avatarUrl = msgData.message?.avatar_url || undefined;

                    // Clearer layout: Title = Type, Body = Who/What
                    const notificationTitle = isMentioned
                        ? t('chat.mentioned_title')
                        : t('chat.new_message_title');

                    const context = channel && !channel.is_direct && channelName ? ` @ ${channelName}` : '';
                    const notificationBody = `${displaySender}${context}: ${content}`;

                    sendSystemNotification(notificationTitle, {
                        body: notificationBody,
                        icon: '/icon.png',
                        iconUrl: avatarUrl ? getFullUrl(avatarUrl) : undefined,
                        tag: `message-${channelId}`,
                        data: { type: 'chat', channel_id: channelId },
                        actions: [{ action: 'view', title: t('common.view') }]
                    });
                }
            }
        }

        if (msgData.message) {
            queryClient.setQueryData<Channel[]>(['channels'], (oldChannels) => {
                if (!oldChannels) return oldChannels;
                return oldChannels.map(ch => {
                    if (ch.id === channelId) {
                        // Determine if we should increment unread_count
                        const isSelf = msgData.message?.sender_id === user?.id;
                        const isViewingChannel = currentChannelIdNum === channelId;
                        const shouldIncrementUnread = !isSelf && !isViewingChannel;

                        return {
                            ...ch,
                            last_message: {
                                id: msgData.message!.id || 0,
                                content: (msgData.message!.content || '').slice(0, 100),
                                sender_id: msgData.message!.sender_id,
                                sender_name: msgData.message!.sender_name || t('common.system'),
                                sender_full_name: msgData.message!.sender_full_name,
                                sender_rank: msgData.message!.sender_rank,
                                created_at: msgData.message!.created_at || new Date().toISOString(),
                            },
                            // Increment unread_count for instant sidebar update
                            unread_count: shouldIncrementUnread ? (ch.unread_count || 0) + 1 : ch.unread_count
                        };
                    }
                    return ch;
                });
            });
        }
    }, [addUnread, location.pathname, user?.notify_browser, user?.notify_sound, queryClient, addDocUnread, t, navigate, addToast, user?.id]);

    const onChannelDeleted = useCallback((data: unknown) => {
        const { channel_id, deleted_by, is_direct, channel_name } = data as { channel_id: number; deleted_by: { full_name?: string; username: string } | null; is_direct: boolean; channel_name: string };
        const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
        queryClient.invalidateQueries({ queryKey: ['channels'] });

        const { clearUnread } = useUnreadStore.getState();
        clearUnread(channel_id);

        if (currentChannelId && parseInt(currentChannelId) === channel_id) {
            navigate('/');
        }

        const deletedByName = deleted_by?.full_name || deleted_by?.username || t('common.unknown');
        addToast({
            type: 'deleted',
            title: t('chat.chat_deleted'),
            message: is_direct
                ? t('chat.direct_chat_deleted_by', { name: deletedByName })
                : t('chat.channel_deleted_by', { name: deletedByName, channel: '' }),
            duration: 6000
        });

        if (user?.notify_browser) {
            sendSystemNotification(t('chat.chat_deleted'), {
                body: is_direct
                    ? t('chat.direct_chat_deleted_by', { name: deletedByName })
                    : t('chat.channel_deleted_by', { name: deletedByName, channel: channel_name }),
                icon: '/icon.png',
                tag: `channel-deleted-${channel_id}`,
            });
        }
    }, [location.pathname, queryClient, navigate, addToast, user?.notify_browser, t]);

    const onDocumentShared = useCallback((data: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sharedData = data as any;
        queryClient.invalidateQueries({ queryKey: ['documents', 'received'] });

        const fileUrl = getFullUrl(sharedData.file_path);

        addToast({
            type: 'success',
            title: t('common.new_document'),
            message: t('common.document_shared_by', { owner: sharedData.owner_name, title: sharedData.title }),
            duration: 10000,
            onClick: () => {
                if (fileUrl) {
                    openViewer(fileUrl, sharedData.title);
                }
            }
        });

        const channelId = sharedData.channel_id;
        const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
        const isViewingChannel = currentChannelId && parseInt(currentChannelId) === channelId;

        if (location.pathname !== '/board' && !isViewingChannel) {
            addDocUnread(sharedData.document_id, channelId);
        }

        const shouldNotify = user?.notify_browser !== false;

        if (shouldNotify) {
            const senderInfo = sharedData.owner_name;
            sendSystemNotification(t('common.new_document'), {
                body: t('common.document_shared_by', { owner: senderInfo, title: sharedData.title }),
                icon: '/icon.png',
                tag: `doc-${sharedData.id}`,
                data: { type: 'chat', channel_id: channelId },
                actions: [{ action: 'view', title: t('common.view') }]
            });
        }
    }, [queryClient, addToast, openViewer, user?.notify_browser, t, addDocUnread, location.pathname]);

    const onUserPresence = useCallback((data: { user_id: number; status: 'online' | 'offline' }) => {
        const delta = data.status === 'online' ? 1 : -1;

        // Update channel_members cache for ALL channels using predicate
        queryClient.getQueriesData<Array<{ id: number; is_online?: boolean; last_seen?: string }>>({ queryKey: ['channel_members'] }).forEach(([queryKey, queryData]) => {
            if (queryData && Array.isArray(queryData)) {
                const updated = queryData.map(m =>
                    m.id === data.user_id
                        ? { ...m, is_online: data.status === 'online', last_seen: data.status === 'offline' ? new Date().toISOString() : m.last_seen }
                        : m
                );
                queryClient.setQueryData(queryKey, updated);
            }
        });

        // Update channels cache for DM other_user.is_online
        queryClient.setQueryData<Channel[]>(['channels'], (old) => {
            if (!old) return old;
            return old.map(c => {
                if (c.is_direct && c.other_user?.id === data.user_id) {
                    return {
                        ...c,
                        other_user: {
                            ...c.other_user,
                            is_online: data.status === 'online',
                            last_seen: data.status === 'offline' ? new Date().toISOString() : c.other_user.last_seen
                        }
                    };
                }
                return c;
            });
        });

        // Update current channel online_count directly in cache
        queryClient.setQueriesData({ queryKey: ['channel'] }, (old: unknown) => {
            if (!old || typeof old !== 'object') return old;
            const channel = old as Channel;
            // Only update if this user is a member (we'll check against channel_members)
            const membersCache = queryClient.getQueryData<Array<{ id: number }>>(['channel_members', String(channel.id)]);
            const isMember = membersCache?.some(m => m.id === data.user_id);
            if (isMember) {
                const newCount = Math.max(0, (channel.online_count || 0) + delta);
                // Also update other_user if it's a DM and this is the user
                const otherUser = channel.is_direct && channel.other_user?.id === data.user_id
                    ? {
                        ...channel.other_user,
                        is_online: data.status === 'online',
                        last_seen: data.status === 'offline' ? new Date().toISOString() : channel.other_user.last_seen
                    }
                    : channel.other_user;

                return { ...channel, online_count: newCount, other_user: otherUser };
            }
            return old;
        });
    }, [queryClient]);

    const onTaskAssigned = useCallback((data: { task_id: number; title: string; issuer_name: string }) => {
        // Invalidate received tasks to show new task immediately
        queryClient.invalidateQueries({ queryKey: ['tasks', 'received'] });

        if (user?.notify_sound) {
            playNotificationSound();
        }

        const title = t('layout.notification_new_task');
        const message = t('layout.notification_new_task_message', { title: data.title, issuer_name: data.issuer_name });

        addToast({
            type: 'info',
            title: title,
            message: message,
            duration: 6000,
            onClick: () => navigate(`/tasks?tab=received&taskId=${data.task_id}`)
        });

        if (user?.notify_browser) {
            sendSystemNotification(t('tasks.new_task'), {
                body: message,
                icon: '/icon.png',
                tag: `task-${data.task_id}`,
                data: { type: 'task', tab: 'received', taskId: data.task_id },
                actions: [{ action: 'view', title: t('common.view') }]
            });
        }
    }, [queryClient, user?.notify_sound, user?.notify_browser, t, addToast, navigate]);

    const onTaskReturned = useCallback((data: { task_id: number; title: string; sender_name: string }) => {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'received'] });

        if (user?.notify_sound) playNotificationSound();

        const title = t('layout.notification_task_returned');
        const message = t('layout.notification_task_returned_message', { title: data.title, sender_name: data.sender_name });

        addToast({
            type: 'warning',
            title: title,
            message: message,
            duration: 6000,
            onClick: () => navigate(`/tasks?tab=received&taskId=${data.task_id}`)
        });

        if (user?.notify_browser) {
            sendSystemNotification(t('tasks.task_returned'), {
                body: message,
                icon: '/icon.png',
                tag: `task-returned-${data.task_id}`,
                data: { type: 'task', tab: 'received', taskId: data.task_id },
                actions: [{ action: 'view', title: t('common.view') }]
            });
        }
    }, [queryClient, user?.notify_sound, user?.notify_browser, t, addToast, navigate]);

    const onTaskSubmitted = useCallback((data: { task_id: number; title: string; sender_name: string }) => {
        // Invalidate issues tasks for issuer
        queryClient.invalidateQueries({ queryKey: ['tasks', 'issued'] });

        if (user?.notify_sound) playNotificationSound();

        const title = t('layout.notification_task_report');
        const message = t('layout.notification_task_report_message', { title: data.title, sender_name: data.sender_name });

        addToast({
            type: 'success',
            title: title,
            message: message,
            duration: 6000,
            onClick: () => navigate(`/tasks?tab=issued&taskId=${data.task_id}`)
        });

        if (user?.notify_browser) {
            sendSystemNotification(t('tasks.task_submitted'), {
                body: message,
                icon: '/icon.png',
                tag: `task-submitted-${data.task_id}`,
                data: { type: 'task', tab: 'issued', taskId: data.task_id },
                actions: [{ action: 'view', title: t('common.view') }]
            });
        }
    }, [queryClient, user?.notify_sound, user?.notify_browser, t, addToast, navigate]);

    const onTaskConfirmed = useCallback((data: { task_id: number; title: string; sender_name: string }) => {
        // Invalidate received tasks for assignee
        queryClient.invalidateQueries({ queryKey: ['tasks', 'received'] });

        if (user?.notify_sound) playNotificationSound();

        const title = t('layout.notification_task_confirmed');
        const message = t('layout.notification_task_confirmed_message', { title: data.title, sender_name: data.sender_name });

        addToast({
            type: 'success',
            title: title,
            message: message,
            duration: 6000,
            onClick: () => navigate(`/tasks?tab=completed&taskId=${data.task_id}`)
        });

        if (user?.notify_browser) {
            sendSystemNotification(t('tasks.task_confirmed'), {
                body: message,
                icon: '/icon.png',
                tag: `task-confirmed-${data.task_id}`,
                data: { type: 'task', tab: 'completed', taskId: data.task_id },
                actions: [{ action: 'view', title: t('common.view') }]
            });
        }
    }, [queryClient, user?.notify_sound, user?.notify_browser, t, addToast, navigate]);

    const onEmailReceived = useCallback((data: { id: number; subject: string; from_address: string }) => {
        incrementEmailsUnread();

        // Dispatch custom event for real-time updates in EmailPage
        window.dispatchEvent(new CustomEvent('new-email', { detail: data }));

        if (user?.notify_sound) playNotificationSound();

        const title = t('email.new_message');
        const message = `${t('email.from')}: ${data.from_address}\n${t('email.subject')}: ${data.subject}`;

        addToast({
            type: 'info',
            title: title,
            message: data.subject,
            duration: 6000,
            onClick: () => navigate('/email')
        });

        if (user?.notify_browser) {
            sendSystemNotification(t('email.new_message'), {
                body: message,
                icon: '/icon.png',
                tag: `email-${data.id}`,
                data: { type: 'email' },
                actions: [{ action: 'view', title: t('common.view') }]
            });
        }
    }, [user?.notify_sound, user?.notify_browser, t, addToast, navigate, incrementEmailsUnread]);

    const onMessageUpdated = useCallback((data: unknown) => {
        const msgData = data as {
            id: number;
            channel_id: number;
            content: string;
            updated_at: string;
        };

        queryClient.setQueryData<Channel[]>(['channels'], (oldChannels) => {
            if (!oldChannels) return oldChannels;
            return oldChannels.map(ch => {
                if (ch.id === msgData.channel_id && ch.last_message?.id === msgData.id) {
                    return {
                        ...ch,
                        last_message: {
                            ...ch.last_message,
                            content: (msgData.content || '').slice(0, 100),
                        }
                    };
                }
                return ch;
            });
        });
    }, [queryClient]);

    useGlobalWebSocket(token, {
        onChannelCreated,
        onMessageReceived,
        onMessageUpdated,
        onChannelDeleted,
        onDocumentShared,
        onUserPresence,
        onTaskAssigned,
        onTaskReturned,
        onTaskSubmitted,
        onTaskConfirmed,
        onEmailReceived
    });

    useEffect(() => {
        if (!window.electron) return;

        const removeHandler = window.electron.onNotificationClicked((data: Record<string, unknown>) => {
            const payload = data as { type: string; channel_id?: number };
            if (payload.type === 'chat' && payload.channel_id) {
                navigate(`/chat/${payload.channel_id}`);
            } else if (payload.type === 'task') {
                navigate('/tasks');
            } else if (payload.type === 'email') {
                navigate('/email');
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const removeActionHandler = (window.electron as any).onNotificationAction?.((payload: { action: string; data: any }) => {
            if (payload.action === 'view' && payload.data) {
                const data = payload.data;
                if (data.type === 'chat' && data.channel_id) {
                    navigate(`/chat/${data.channel_id}`);
                } else if (data.type === 'task') {
                    navigate('/tasks');
                } else if (data.type === 'email') {
                    navigate('/email');
                }
            }
        });

        return () => {
            removeHandler();
            if (removeActionHandler) removeActionHandler();
        };
    }, [navigate]);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Connection status notifications
    const wasOfflineRef = useRef(isOffline);
    const wasConnectedRef = useRef(isConnected);

    useEffect(() => {
        if (isOffline && !wasOfflineRef.current) {
            addToast({
                type: 'error',
                title: t('layout.toast_offline_title'),
                message: t('layout.toast_offline_message'),
                duration: 5000
            });
        } else if (!isOffline && wasOfflineRef.current) {
            addToast({
                type: 'success',
                title: t('layout.toast_online_title'),
                message: t('layout.toast_online_message'),
                duration: 3000
            });
        }
        wasOfflineRef.current = isOffline;
    }, [isOffline, addToast, t]);

    useEffect(() => {
        if (!isOffline) {
            if (!isConnected && wasConnectedRef.current) {
                addToast({
                    type: 'warning',
                    title: t('layout.toast_reconnecting_title'),
                    message: t('layout.toast_reconnecting_message'),
                    duration: 4000
                });
            } else if (isConnected && !wasConnectedRef.current) {
                addToast({
                    type: 'success',
                    title: t('layout.toast_connected_title'),
                    message: t('layout.toast_connected_message'),
                    duration: 3000
                });
            }
        }
        wasConnectedRef.current = isConnected;
    }, [isConnected, isOffline, addToast, t]);

    // Fetch public system settings (for system notice)
    const { data: systemSettings } = useQuery<Record<string, string>>({
        queryKey: ['public-settings'],
        queryFn: async () => (await api.get('/admin/public-settings')).data,
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const systemNotice = systemSettings?.system_notice;

    return (
        <div className="flex h-screen overflow-hidden bg-[#F0F0F0]">
            {/* Connectivity Banner */}
            {isOffline ? (
                <div className="fixed top-0 inset-x-0 bg-amber-500 text-white px-4 py-1.5 text-center text-xs font-black tracking-[0.15em] uppercase shadow-lg border-b border-white/10 z-[101] animate-in slide-in-from-top-full duration-500 flex items-center justify-center gap-3">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span>{t('layout.banner_offline')}</span>
                </div>
            ) : !isConnected ? (
                <div className="fixed top-0 inset-x-0 bg-[#5B5FC7] text-white px-4 py-1.5 text-center text-xs font-black tracking-[0.15em] uppercase shadow-lg border-b border-white/10 z-[101] animate-in slide-in-from-top-full duration-500 flex items-center justify-center gap-3">
                    <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('layout.banner_connecting')}</span>
                </div>
            ) : null}

            {/* System Notice Banner */}
            {systemNotice && (
                <div className="fixed top-0 inset-x-0 bg-gradient-to-r from-[#C4314B]/90 to-rose-600/90 backdrop-blur-md text-white px-4 py-1.5 text-center text-xs font-bold tracking-wide shadow-lg border-b border-white/10 z-[100] animate-in slide-in-from-top-full duration-500 whitespace-nowrap overflow-hidden text-ellipsis">
                    {systemNotice}
                </div>
            )}

            <SidebarNav />

            <div className="flex-1 flex min-w-0 flex-col md:ml-[68px] bg-[#F5F5F5]">
                <main className="flex-1 relative h-full shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)]">
                    <Outlet />
                </main>
            </div>

            <DocumentViewer />
        </div>
    );
};

export default MainLayout;
