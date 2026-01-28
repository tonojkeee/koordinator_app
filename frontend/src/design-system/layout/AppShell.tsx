import React, { useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PrimarySidebar } from './PrimarySidebar';
import { useUIStore } from '../../stores/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { useConnectionStore } from '../../store/useConnectionStore';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useTasksIssued } from '../../features/tasks/tasksApi';
import { useGlobalWebSocket } from '../../hooks/useGlobalWebSocket';
import { useToast } from '../components/ToastContext';
import api from '../../api/client';
import type { Channel } from '../../types';
import type { Task } from '../../features/tasks/types';
import { useTranslation } from 'react-i18next';
import { playNotificationSound } from '../../utils/sound';
import DocumentViewer from '../../features/board/components/DocumentViewer';
import { sendSystemNotification } from '../../services/notificationService';

interface AppShellProps {
  children: React.ReactNode;
  secondaryNav?: React.ReactNode;
}

interface WSMessageData {
  id: number;
  channel_id: number;
  sender_id: number;
  sender_name: string;
  sender_full_name?: string | null;
  sender_rank?: string | null;
  content: string;
  document_id?: number;
  created_at: string;
}

interface WSEmailData {
  id: number;
  subject: string;
  from_address: string;
  received_at: string;
}

interface WSTaskData {
  task_id: number;
  title: string;
  issuer_name?: string;
  sender_name?: string;
}

interface WSMessageUpdatedData {
  id: number;
  channel_id: number;
  content: string;
}

interface WSDocumentSharedData {
  owner_name: string;
  title: string;
  channel_id: number;
  document_id: number;
}

/**
 * AppShell is the main layout component that orchestrates the primary navigation,
 * optional secondary navigation, and the main content area.
 */
export const AppShell: React.FC<AppShellProps> = ({ children, secondaryNav: propSecondaryNav }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { secondaryNavContent, isSecondarySidebarOpen } = useUIStore();
  const { user, token } = useAuthStore();
  const { addToast } = useToast();
  const {
    addUnread,
    syncUnreads,
    addDocUnread,
    clearDocUnread,
    setTasksUnread,
    setTasksReview,
    setEmailsUnread,
    incrementEmailsUnread
  } = useUnreadStore();
  const { isConnected, isOffline } = useConnectionStore();

  const secondaryNav = propSecondaryNav || secondaryNavContent;

  // --- Global Data Fetching ---

  // Fetch channels to get initial unread counts
  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await api.get('/chat/channels');
      return res.data;
    },
    enabled: !!token,
  });

  // Sync backend unread counts
  useEffect(() => {
    if (channels && Array.isArray(channels)) {
      const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
      const currentChannelIdNum = currentChannelId ? Number(currentChannelId) : null;

      const counts: Record<number, number> = {};
      channels.forEach(c => {
        if (currentChannelIdNum && c.id === currentChannelIdNum) {
          counts[c.id] = 0;
        } else {
          counts[c.id] = c.unread_count;
        }
      });
      syncUnreads(counts);
    }
  }, [channels, syncUnreads, location.pathname]);

  // Clear document unread on board visit
  useEffect(() => {
    if (location.pathname === '/board') {
      clearDocUnread();
    }
  }, [location.pathname, clearDocUnread]);

  // Fetch received tasks for badge
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ['tasks', 'received'],
    queryFn: async () => {
      const res = await api.get('/tasks/received');
      return res.data;
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (Array.isArray(tasks)) {
      const activeCount = tasks.filter((t) =>
        t.status === 'in_progress' || t.status === 'overdue'
      ).length;
      setTasksUnread(activeCount);
    }
  }, [tasks, setTasksUnread]);

  const { data: issuedTasks } = useTasksIssued();
  useEffect(() => {
    if (Array.isArray(issuedTasks)) {
      const reviews = issuedTasks.filter(t => t.status === 'on_review').length;
      setTasksReview(reviews);
    }
  }, [issuedTasks, setTasksReview]);

  // Fetch email unread count
  useEffect(() => {
    const fetchEmailUnread = async () => {
      try {
        const res = await api.get('/email/unread-count');
        setEmailsUnread(res.data.total);
      } catch (err) {
        console.error('Failed to fetch email unread count', err);
      }
    };
    if (token) fetchEmailUnread();
  }, [token, setEmailsUnread]);

  // --- WebSocket Handlers ---

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
      message?: WSMessageData;
    };

    const channelId = Number(msgData.channel_id);
    const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
    const currentChannelIdNum = currentChannelId ? Number(currentChannelId) : null;

    if (!currentChannelIdNum || currentChannelIdNum !== channelId) {
      const isSelf = msgData.message?.sender_id === user?.id;

      if (!isSelf) {
        addUnread(channelId);
        const currentChannels = queryClient.getQueryData<Channel[]>(['channels']);
        const channel = Array.isArray(currentChannels) ? currentChannels.find(c => c.id === channelId) : undefined;
        const isMuted = channel?.mute_until ? new Date(channel.mute_until) > new Date() : false;

        if (user?.notify_sound && !isMuted) playNotificationSound();

        const shouldNotify = user?.notify_browser !== false;
        if (msgData.message?.document_id) {
          addDocUnread(msgData.message.document_id, channelId);
        }

        if (shouldNotify && !msgData.message?.document_id && !isMuted) {
          const senderName = msgData.message?.sender_name || t('common.someone');
          const content = msgData.message?.content || t('chat.new_message_default');
          const isMentioned = msgData.is_mentioned;

          if (isMentioned) {
            addToast({
              type: 'info',
              title: isMentioned ? t('chat.mentioned_by', { name: senderName }) : senderName,
              message: content,
              duration: 5000,
              onClick: () => navigate(`/chat/${channelId}`)
            });
          }

          const notificationTitle = isMentioned ? t('chat.mentioned_title') : t('chat.new_message_title');
          const context = channel && !channel.is_direct && (channel.display_name || channel.name) ? ` @ ${channel.display_name || channel.name}` : '';

          sendSystemNotification(notificationTitle, {
            body: `${msgData.message?.sender_full_name || senderName}${context}: ${content}`,
            icon: '/icon.png',
            tag: `message-${channelId}`,
            data: { type: 'chat', channel_id: channelId },
            actions: [{ action: 'view', title: t('common.view') }]
          });
        }
      }
    }

    if (msgData.message) {
      const message = msgData.message;
      queryClient.setQueryData<Channel[]>(['channels'], (old) => {
        if (!old) return old;
        return old.map(ch => {
          if (ch.id === channelId) {
            const isSelf = message.sender_id === user?.id;
            const isViewing = currentChannelIdNum === channelId;
            return {
              ...ch,
              last_message: {
                id: message.id,
                content: (message.content || '').slice(0, 100),
                sender_id: message.sender_id,
                sender_name: message.sender_name,
                sender_full_name: message.sender_full_name,
                sender_rank: message.sender_rank,
                created_at: message.created_at
              },
              unread_count: (!isSelf && !isViewing) ? (ch.unread_count || 0) + 1 : ch.unread_count
            };
          }
          return ch;
        });
      });
    }
  }, [addUnread, location.pathname, user, queryClient, addDocUnread, t, navigate, addToast]);

  const onEmailReceived = useCallback((data: WSEmailData) => {
    incrementEmailsUnread();
    window.dispatchEvent(new CustomEvent('new-email', { detail: data }));
    if (user?.notify_sound) playNotificationSound();

    addToast({
      type: 'info',
      title: t('email.new_message'),
      message: data.subject,
      duration: 6000,
      onClick: () => navigate('/email')
    });

    if (user?.notify_browser) {
      sendSystemNotification(t('email.new_message'), {
        body: `${t('email.from')}: ${data.from_address}\n${t('email.subject')}: ${data.subject}`,
        icon: '/icon.png',
        tag: `email-${data.id}`,
        data: { type: 'email' },
        actions: [{ action: 'view', title: t('common.view') }]
      });
    }
  }, [user?.notify_sound, user?.notify_browser, t, addToast, navigate, incrementEmailsUnread]);

  const onChannelDeleted = useCallback((data: unknown) => {
    const { channel_id, deleted_by, is_direct, channel_name } = data as {
      channel_id: number;
      deleted_by: { full_name?: string; username?: string };
      is_direct: boolean;
      channel_name: string
    };
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
        : t('chat.channel_deleted_by', { name: deletedByName, channel: channel_name }),
      duration: 6000
    });
  }, [location.pathname, queryClient, navigate, addToast, t]);

  const onDocumentShared = useCallback((data: unknown) => {
    const sharedData = data as WSDocumentSharedData;
    queryClient.invalidateQueries({ queryKey: ['documents', 'received'] });

    addToast({
      type: 'success',
      title: t('common.new_document'),
      message: t('common.document_shared_by', { owner: sharedData.owner_name, title: sharedData.title }),
      duration: 10000,
    });

    const channelId = sharedData.channel_id;
    const currentChannelId = location.pathname.match(/\/chat\/(\d+)/)?.[1];
    const isViewingChannel = currentChannelId && parseInt(currentChannelId) === channelId;

    if (location.pathname !== '/board' && !isViewingChannel) {
      addDocUnread(sharedData.document_id, channelId);
    }
  }, [queryClient, addToast, t, addDocUnread, location.pathname]);

  const onUserPresence = useCallback((data: { user_id: number; status: 'online' | 'offline' }) => {
    queryClient.setQueryData<{ online_user_ids: number[] }>(['users', 'online'], (old) => {
      if (!old) return old;
      const currentIds = new Set(old.online_user_ids);
      if (data.status === 'online') currentIds.add(data.user_id);
      else currentIds.delete(data.user_id);
      return { ...old, online_user_ids: Array.from(currentIds) };
    });

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
  }, [queryClient]);

  const onTaskAssigned = useCallback((data: WSTaskData) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'received'] });
    if (user?.notify_sound) playNotificationSound();
    addToast({
      type: 'info',
      title: t('tasks.new_task'),
      message: t('layout.notification_new_task_message', { title: data.title, issuer_name: data.issuer_name }),
      duration: 6000,
      onClick: () => navigate(`/tasks?tab=received&taskId=${data.task_id}`)
    });
  }, [queryClient, user?.notify_sound, t, addToast, navigate]);

  const onTaskReturned = useCallback((data: WSTaskData) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'received'] });
    if (user?.notify_sound) playNotificationSound();
    addToast({
      type: 'warning',
      title: t('layout.notification_task_returned'),
      message: t('layout.notification_task_returned_message', { title: data.title, sender_name: data.sender_name }),
      duration: 6000,
      onClick: () => navigate(`/tasks?tab=received&taskId=${data.task_id}`)
    });
  }, [queryClient, user?.notify_sound, t, addToast, navigate]);

  const onTaskSubmitted = useCallback((data: WSTaskData) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'issued'] });
    if (user?.notify_sound) playNotificationSound();
    addToast({
      type: 'success',
      title: t('layout.notification_task_report'),
      message: t('layout.notification_task_report_message', { title: data.title, sender_name: data.sender_name }),
      duration: 6000,
      onClick: () => navigate(`/tasks?tab=issued&taskId=${data.task_id}`)
    });
  }, [queryClient, user?.notify_sound, t, addToast, navigate]);

  const onTaskConfirmed = useCallback((data: WSTaskData) => {
    queryClient.invalidateQueries({ queryKey: ['tasks', 'received'] });
    if (user?.notify_sound) playNotificationSound();
    addToast({
      type: 'success',
      title: t('layout.notification_task_confirmed'),
      message: t('layout.notification_task_confirmed_message', { title: data.title, sender_name: data.sender_name }),
      duration: 6000,
      onClick: () => navigate(`/tasks?tab=completed&taskId=${data.task_id}`)
    });
  }, [queryClient, user?.notify_sound, t, addToast, navigate]);

  useGlobalWebSocket(token, {
    onChannelCreated,
    onMessageReceived,
    onEmailReceived,
    onChannelDeleted,
    onDocumentShared,
    onUserPresence,
    onTaskAssigned,
    onTaskReturned,
    onTaskSubmitted,
    onTaskConfirmed,
    onMessageUpdated: (data: unknown) => {
      const messageData = data as WSMessageUpdatedData;
      queryClient.setQueryData<Channel[]>(['channels'], (old) => {
        if (!old) return old;
        return old.map(ch => {
          if (ch.id === messageData.channel_id && ch.last_message?.id === messageData.id) {
            return { ...ch, last_message: { ...ch.last_message, content: messageData.content.slice(0, 100) } };
          }
          return ch;
        });
      });
    }
  });

  // --- Electron & Notifications ---
  useEffect(() => {
    if (!window.electron) return;
    return window.electron.onNotificationClicked((data: Record<string, unknown>) => {
      if (data.type === 'chat' && data.channel_id) navigate(`/chat/${data.channel_id}`);
      else if (data.type === 'task') navigate('/tasks');
      else if (data.type === 'email') navigate('/email');
    });
  }, [navigate]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- Banners & Connectivity ---
  const { data: systemSettings } = useQuery<Record<string, string>>({
    queryKey: ['public-settings'],
    queryFn: async () => (await api.get('/admin/public-settings')).data,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const systemNotice = systemSettings?.system_notice;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Connectivity Banner */}
      {isOffline ? (
        <div className="fixed top-0 inset-x-0 bg-amber-500 text-white px-4 py-1 text-center text-[10px] font-black tracking-widest uppercase z-[101] flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span>{t('layout.banner_offline')}</span>
        </div>
      ) : !isConnected ? (
        <div className="fixed top-0 inset-x-0 bg-primary text-white px-4 py-1 text-center text-[10px] font-black tracking-widest uppercase z-[101] flex items-center justify-center gap-2">
          <div className="w-2 h-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>{t('layout.banner_connecting')}</span>
        </div>
      ) : null}

      {/* System Notice Banner */}
      {systemNotice && (
        <div className="fixed top-0 inset-x-0 bg-destructive text-white px-4 py-1 text-center text-[10px] font-black tracking-widest uppercase z-[100] truncate">
          {systemNotice}
        </div>
      )}

      {/* Primary Navigation Sidebar */}
      <PrimarySidebar />

      {/* Secondary Navigation Sidebar */}
      {secondaryNav && isSecondarySidebarOpen && (
        <aside className="w-64 flex-shrink-0 border-r border-border bg-surface-1 overflow-y-auto overflow-x-hidden">
          {secondaryNav}
        </aside>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-hidden relative bg-surface">
        <div className="h-full w-full overflow-hidden animate-fade-in">
          {children}
        </div>
      </main>

      <DocumentViewer />
    </div>
  );
};
