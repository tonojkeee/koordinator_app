import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Channel } from '../../types';
import { AxiosError } from 'axios';
import { Loader2, MessageSquare, Pin, Filter, Plus, Search, Lock, Globe, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { Modal, Input, Button, SecondarySidebar, cn } from '../../design-system';
import MuteModal from './MuteModal';
import { ChannelItem } from './components/ChannelItem';

interface ChannelSidebarProps {
  onCloseMobile?: () => void;
}


// Встроенный компонент CreateChannelModal
interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, visibility: 'public' | 'private') => void;
}

function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const { t } = useTranslation();
  const [channelName, setChannelName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      onCreate(channelName.trim(), visibility);
      setChannelName('');
      setVisibility('public');
      onClose();
    }
  };

  const handleClose = () => {
    setChannelName('');
    setVisibility('public');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={visibility === 'public' ? t('chat.create_public_channel') : t('chat.create_private_channel')}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            fullWidth
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!channelName.trim()}
            fullWidth
          >
            {visibility === 'public' ? t('chat.create_public_channel') : t('chat.create_private_channel')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t('chat.channel_name')}
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder={t('chat.channel_name')}
          autoFocus
          fullWidth
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {t('chat.channel_visibility')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${visibility === 'public'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${visibility === 'public' ? 'bg-indigo-500' : 'bg-slate-400'
                  }`}>
                  <Globe size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {t('chat.public_channel')}
                </span>
                <span className="text-xs text-slate-500 text-center">
                  {t('chat.public_channel_description')}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={`p-4 rounded-xl border-2 transition-all text-left ${visibility === 'private'
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${visibility === 'private' ? 'bg-indigo-500' : 'bg-slate-400'
                  }`}>
                  <Lock size={20} className="text-white" />
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {t('chat.private_channel')}
                </span>
                <span className="text-xs text-slate-500 text-center">
                  {t('chat.private_channel_description')}
                </span>
              </div>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const ChannelSidebar: React.FC<ChannelSidebarProps> = ({ onCloseMobile }) => {
  const { t } = useTranslation();
  const { channelId } = useParams();
  const navigate = useNavigate();

  // Универсальная функция навигации с fallback
  const navigateToChannel = useCallback((targetChannelId: number) => {
    try {
      navigate(`/chat/${targetChannelId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback в случае ошибки навигации
      window.location.href = `/chat/${targetChannelId}`;
    }
  }, [navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [muteModalChannelId, setMuteModalChannelId] = useState<number | null>(null);
  const { user: currentUser } = useAuthStore();
  const { unreadCounts } = useUnreadStore();
  const queryClient = useQueryClient();
  const [extraChannel, setExtraChannel] = useState<Channel | null>(null);

  // States for collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    system: true,
    pinned: true,
    public: true,
    private: true,
    direct: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Принудительно инвалидируем кэш каналов при монтировании компонента
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['channels'] });
  }, [queryClient]);

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await api.get('/chat/channels');
      return res.data;
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    refetchOnWindowFocus: true, // Обновляем при фокусе окна
  });

  useEffect(() => {
    if (channelId && !channels.some(c => c.id === parseInt(channelId))) {
      api.get(`/chat/channels/${channelId}`)
        .then(res => setExtraChannel(res.data))
        .catch(() => setExtraChannel(null));
    } else {
      const frame = requestAnimationFrame(() => {
        if (extraChannel !== null) setExtraChannel(null);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [channelId, channels, extraChannel]);

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; visibility: 'public' | 'private' }) => {
      const res = await api.post('/chat/channels', data);
      return res.data;
    },
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setIsCreating(false);
      navigateToChannel(newChannel.id);
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/chat/channels/${id}`);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      queryClient.removeQueries({ queryKey: ['messages', String(deletedId)] });
      queryClient.removeQueries({ queryKey: ['channel', String(deletedId)] });
      queryClient.removeQueries({ queryKey: ['channel_members', String(deletedId)] });

      if (Number(channelId) === deletedId) {
        navigate('/');
      }
    },
    onError: (error: unknown) => {
      const err = error as AxiosError<{ detail: string }>;
      alert(t('common.error') + ': ' + (err.response?.data?.detail || err.message));
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/chat/channels/${id}/pin`);
      return { id, is_pinned: res.data.is_pinned };
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['channels'] });
      const previousChannels = queryClient.getQueryData<Channel[]>(['channels']);

      queryClient.setQueryData<Channel[]>(['channels'], (old) => {
        if (!old) return [];
        return old.map(c =>
          c.id === id ? { ...c, is_pinned: !c.is_pinned } : c
        );
      });

      if (extraChannel && extraChannel.id === id) {
        setExtraChannel(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null);
      }

      return { previousChannels };
    },
    onError: (_err, _id, context: unknown) => {
      const ctx = context as { previousChannels: Channel[] };
      if (ctx?.previousChannels) {
        queryClient.setQueryData(['channels'], ctx.previousChannels);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
    }
  });

  const muteMutation = useMutation({
    mutationFn: async ({ channelId, muteUntil }: { channelId: number; muteUntil: string | null }) => {
      const { data } = await api.post(`/chat/channels/${channelId}/mute`, null, {
        params: { mute_until: muteUntil }
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(['channels'], (old: Channel[] | undefined) => {
        if (!old) return old;
        return old.map(c => c.id === variables.channelId ? { ...c, mute_until: variables.muteUntil } : c);
      });
      setMuteModalChannelId(null);
    }
  });

  const handleMute = (duration: '1h' | '8h' | '24h' | 'forever' | null) => {
    if (!muteModalChannelId) return;

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

    muteMutation.mutate({ channelId: muteModalChannelId, muteUntil });
  };

  const handleCreateChannel = (name: string, visibility: 'public' | 'private') => {
    if (name.trim()) {
      createChannelMutation.mutate({ name: name.trim(), visibility });
    }
  };

  const handleDelete = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm(t('chat.deleteConfirm'))) {
      deleteChannelMutation.mutate(id);
    }
  };

  const handlePin = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    togglePinMutation.mutate(id);
  };

  const filteredChannels = channels.filter(c =>
    (c.display_name || c.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemChannels = filteredChannels.filter(c => c.is_system);
  const pinnedChannels = filteredChannels.filter(c => c.is_pinned && !c.is_system);
  const publicChannels = filteredChannels.filter(c => !c.is_direct && !c.is_pinned && !c.is_system && c.visibility === 'public');
  const privateChannels = filteredChannels.filter(c => !c.is_direct && !c.is_pinned && !c.is_system && c.visibility === 'private');
  const directChannels = filteredChannels.filter(c => c.is_direct && !c.is_pinned && !c.is_system);

  if (extraChannel && (extraChannel.display_name || extraChannel.name || '').toLowerCase().includes(searchQuery.toLowerCase())) {
    if (extraChannel.is_system) {
      if (!systemChannels.some(c => c.id === extraChannel.id)) systemChannels.push(extraChannel);
    } else if (extraChannel.is_pinned) {
      if (!pinnedChannels.some(c => c.id === extraChannel.id)) pinnedChannels.push(extraChannel);
    } else if (extraChannel.is_direct) {
      if (!directChannels.some(c => c.id === extraChannel.id)) directChannels.push(extraChannel);
    } else if (extraChannel.visibility === 'private') {
      if (!privateChannels.some(c => c.id === extraChannel.id)) privateChannels.push(extraChannel);
    } else {
      if (!publicChannels.some(c => c.id === extraChannel.id)) publicChannels.push(extraChannel);
    }
  }

  const getUnreadDisplay = (channel: Channel) => unreadCounts[channel.id] || 0;

  const actions = (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => setIsCreating(true)}
        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all active:scale-95"
        title={t('chat.create_channel')}
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
      <button className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all active:scale-95">
        <Filter size={18} strokeWidth={2.5} />
      </button>
    </div>
  );

  const SectionHeader = ({
    title,
    count,
    expanded,
    onToggle,
    icon: Icon
  }: {
    title: string;
    count: number;
    expanded: boolean;
    onToggle: () => void;
    icon?: any;
  }) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-[0.05em] text-slate-500/70 hover:text-slate-900 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
          {expanded ? <ChevronDown size={12} strokeWidth={3} /> : <ChevronRight size={12} strokeWidth={3} />}
        </div>
        {Icon && <Icon size={12} strokeWidth={2.5} className="opacity-70" />}
        <span>{title}</span>
        {count > 0 && <span className="ml-1 text-[10px] opacity-40">({count})</span>}
      </div>
    </button>
  );

  return (
    <SecondarySidebar title={t('chat.title')} actions={actions}>
      <div className="px-3 py-2 mb-2 shrink-0">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('common.search') || 'Search...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100/80 border-none rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="space-y-1 pb-4">
        {isLoading && channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.loading')}</span>
          </div>
        ) : (
          <>
            {systemChannels.length > 0 && (
              <div>
                <SectionHeader
                  title={t('common.system') || 'System'}
                  count={systemChannels.length}
                  expanded={expandedSections.system}
                  onToggle={() => toggleSection('system')}
                  icon={Settings}
                />
                {expandedSections.system && (
                  <div className="space-y-0.5 px-2">
                    {systemChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigateToChannel(channel.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                        isSystem={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {pinnedChannels.length > 0 && (
              <div className="mt-4">
                <SectionHeader
                  title={t('chat.fileNotification.pinned')}
                  count={pinnedChannels.length}
                  expanded={expandedSections.pinned}
                  onToggle={() => toggleSection('pinned')}
                  icon={Pin}
                />
                {expandedSections.pinned && (
                  <div className="space-y-0.5 px-2">
                    {pinnedChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigateToChannel(channel.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {publicChannels.length > 0 && (
              <div className="mt-4">
                <SectionHeader
                  title={t('chat.publicSpace')}
                  count={publicChannels.length}
                  expanded={expandedSections.public}
                  onToggle={() => toggleSection('public')}
                  icon={Globe}
                />
                {expandedSections.public && (
                  <div className="space-y-0.5 px-2">
                    {publicChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigateToChannel(channel.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {privateChannels.length > 0 && (
              <div className="mt-4">
                <SectionHeader
                  title={t('chat.privateSpace')}
                  count={privateChannels.length}
                  expanded={expandedSections.private}
                  onToggle={() => toggleSection('private')}
                  icon={Lock}
                />
                {expandedSections.private && (
                  <div className="space-y-0.5 px-2">
                    {privateChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigateToChannel(channel.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {directChannels.length > 0 && (
              <div className="mt-4">
                <SectionHeader
                  title={t('chat.directMessages')}
                  count={directChannels.length}
                  expanded={expandedSections.direct}
                  onToggle={() => toggleSection('direct')}
                  icon={MessageSquare}
                />
                {expandedSections.direct && (
                  <div className="space-y-0.5 px-2">
                    {directChannels.map((channel) => (
                      <ChannelItem
                        key={channel.id}
                        channel={channel}
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigateToChannel(channel.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <CreateChannelModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={handleCreateChannel}
      />

      <MuteModal
        isOpen={!!muteModalChannelId}
        onClose={() => setMuteModalChannelId(null)}
        onMute={handleMute}
      />
    </SecondarySidebar>
  );
};

export default React.memo(ChannelSidebar);
