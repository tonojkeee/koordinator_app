import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Channel } from '../../types';
import { AxiosError } from 'axios';
import { Loader2, Trash2, Layers, MessageSquare, Pin, BellOff, Crown, Filter, Edit, Search, Lock, Globe } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { useUnreadStore } from '../../store/useUnreadStore';
import { abbreviateRank } from '../../utils/formatters';
import { Modal, Input, TextArea, Button, Avatar, ContextMenu, type ContextMenuOption, Tooltip } from '../../design-system';
import MuteModal from './MuteModal';

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
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                visibility === 'public'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  visibility === 'public' ? 'bg-indigo-500' : 'bg-slate-400'
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
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                visibility === 'private'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  visibility === 'private' ? 'bg-indigo-500' : 'bg-slate-400'
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [muteModalChannelId, setMuteModalChannelId] = useState<number | null>(null);
  const { user: currentUser } = useAuthStore();
  const { unreadCounts } = useUnreadStore();
  const queryClient = useQueryClient();
  const [extraChannel, setExtraChannel] = useState<Channel | null>(null);

  const { data: channels = [], isLoading } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await api.get('/chat/channels');
      return res.data;
    }
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
      navigate(`/chat/${newChannel.id}`);
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

  // Handlers
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

  const pinnedChannels = filteredChannels.filter(c => c.is_pinned);
  const publicChannels = filteredChannels.filter(c => !c.is_direct && !c.is_pinned && c.visibility === 'public');
  const privateChannels = filteredChannels.filter(c => !c.is_direct && !c.is_pinned && c.visibility === 'private');
  const directChannels = filteredChannels.filter(c => c.is_direct && !c.is_pinned);

  if (extraChannel && (extraChannel.display_name || extraChannel.name || '').toLowerCase().includes(searchQuery.toLowerCase())) {
    if (extraChannel.is_pinned) {
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

  return (
    <div className="w-full h-full flex flex-col bg-[#F5F5F7] border-r border-slate-200">
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-800">{t('chat.title')}</h2>
        <div className="flex items-center space-x-1">
          <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors">
            <Filter size={18} />
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder={t('common.search') || 'Search'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 custom-scrollbar">
        {isLoading && channels.length === 0 ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-indigo-500" /></div>
        ) : (
          <>
            {pinnedChannels.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 px-2 text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2 mt-2">
                  <Pin size={12} className="text-indigo-400" />
                  <span>{t('chat.fileNotification.pinned')}</span>
                </div>
                {pinnedChannels.map((channel) => {
                  const contextOptions: ContextMenuOption[] = [
                    {
                      label: t('chat.unpin'),
                      icon: Pin,
                      onClick: () => togglePinMutation.mutate(channel.id)
                    },
                    {
                      label: channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute'),
                      icon: BellOff,
                      onClick: () => setMuteModalChannelId(channel.id)
                    }
                  ];
                  if (channel.created_by === currentUser?.id || currentUser?.role === 'admin') {
                    contextOptions.push({
                      label: t('chat.deleteChat'),
                      icon: Trash2,
                      variant: 'danger',
                      onClick: () => {
                        if (window.confirm(t('chat.deleteConfirm'))) {
                          deleteChannelMutation.mutate(channel.id);
                        }
                      }
                    });
                  }

                  return (
                    <ContextMenu key={channel.id} options={contextOptions}>
                      <ChannelItem 
                        channel={channel} 
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigate(`/chat/${channel.id}`);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    </ContextMenu>
                  );
                })}
              </div>
            )}

            {publicChannels.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 mt-2">
                  <Layers size={12} className="text-slate-300" />
                  <span>{t('chat.publicSpace')}</span>
                </div>
                {publicChannels.map((channel) => {
                  const contextOptions: ContextMenuOption[] = [
                    {
                      label: t('chat.pin'),
                      icon: Pin,
                      onClick: () => togglePinMutation.mutate(channel.id)
                    },
                    {
                      label: channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute'),
                      icon: BellOff,
                      onClick: () => setMuteModalChannelId(channel.id)
                    }
                  ];
                  if (channel.created_by === currentUser?.id || currentUser?.role === 'admin') {
                    contextOptions.push({
                      label: t('chat.deleteChat'),
                      icon: Trash2,
                      variant: 'danger',
                      onClick: () => {
                        if (window.confirm(t('chat.deleteConfirm'))) {
                          deleteChannelMutation.mutate(channel.id);
                        }
                      }
                    });
                  }

                  return (
                    <ContextMenu key={channel.id} options={contextOptions}>
                      <ChannelItem 
                        channel={channel} 
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigate(`/chat/${channel.id}`);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    </ContextMenu>
                  );
                })}
              </div>
            )}

            {privateChannels.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 px-2 text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-2 mt-2">
                  <Lock size={12} className="text-amber-500" />
                  <span>{t('chat.privateSpace')}</span>
                </div>
                {privateChannels.map((channel) => {
                  const contextOptions: ContextMenuOption[] = [
                    {
                      label: t('chat.pin'),
                      icon: Pin,
                      onClick: () => togglePinMutation.mutate(channel.id)
                    },
                    {
                      label: channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute'),
                      icon: BellOff,
                      onClick: () => setMuteModalChannelId(channel.id)
                    }
                  ];
                  if (channel.created_by === currentUser?.id || currentUser?.role === 'admin') {
                    contextOptions.push({
                      label: t('chat.deleteChat'),
                      icon: Trash2,
                      variant: 'danger',
                      onClick: () => {
                        if (window.confirm(t('chat.deleteConfirm'))) {
                          deleteChannelMutation.mutate(channel.id);
                        }
                      }
                    });
                  }

                  return (
                    <ContextMenu key={channel.id} options={contextOptions}>
                      <ChannelItem 
                        channel={channel} 
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigate(`/chat/${channel.id}`);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    </ContextMenu>
                  );
                })}
              </div>
            )}

            {directChannels.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 mt-2">
                  <MessageSquare size={12} className="text-slate-300" />
                  <span>{t('chat.directMessages')}</span>
                </div>
                {directChannels.map((channel) => {
                  const contextOptions: ContextMenuOption[] = [
                    {
                      label: t('chat.pin'),
                      icon: Pin,
                      onClick: () => togglePinMutation.mutate(channel.id)
                    },
                    {
                      label: channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute'),
                      icon: BellOff,
                      onClick: () => setMuteModalChannelId(channel.id)
                    }
                  ];
                  if (channel.created_by === currentUser?.id || currentUser?.role === 'admin') {
                    contextOptions.push({
                      label: t('chat.deleteChat'),
                      icon: Trash2,
                      variant: 'danger',
                      onClick: () => {
                        if (window.confirm(t('chat.deleteConfirm'))) {
                          deleteChannelMutation.mutate(channel.id);
                        }
                      }
                    });
                  }

                  return (
                    <ContextMenu key={channel.id} options={contextOptions}>
                      <ChannelItem 
                        channel={channel} 
                        isActive={Number(channelId) === channel.id}
                        unread={getUnreadDisplay(channel)}
                        onClick={() => {
                          navigate(`/chat/${channel.id}`);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        onPin={handlePin}
                        onDelete={handleDelete}
                        onMute={() => setMuteModalChannelId(channel.id)}
                        currentUser={currentUser}
                        t={t}
                      />
                    </ContextMenu>
                  );
                })}
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
    </div>
  );
};

const ChannelItem = ({ 
  channel, isActive, unread, onClick, onPin, onDelete, onMute, currentUser, t 
}: {  
  channel: Channel, 
  isActive: boolean, 
  unread: number, 
  onClick: () => void,
  onPin: (e: React.MouseEvent, id: number) => void,
  onDelete: (e: React.MouseEvent, id: number) => void,
  onMute: () => void,
  currentUser: { id: number; role: string } | null,
  t: (key: string) => string
}) => { 

  return (
    <div
      onClick={onClick}
      className={`
        group relative flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
        ${isActive 
          ? channel.visibility === 'private' && !channel.is_direct
            ? 'bg-gradient-to-r from-amber-50 to-amber-100 shadow-sm ring-1 ring-amber-200' 
            : 'bg-white shadow-sm ring-1 ring-slate-200'
          : 'hover:bg-white/60 hover:shadow-sm'
        }
      `}
    >
      <div className="relative shrink-0 mr-3">
        <Avatar 
          src={channel.is_direct ? channel.other_user?.avatar_url : undefined}
          name={channel.display_name || channel.name}
          size="md"
          className="rounded-lg"
        />
        {channel.visibility === 'private' && !channel.is_direct && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <Lock size={8} className="text-white" />
          </div>
        )}
        {channel.is_direct && (
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#F5F5F7] rounded-full ${channel.other_user?.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <h3 className={`text-sm font-semibold truncate flex items-center ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
            {channel.other_user?.rank && <span className="text-slate-400 mr-1 font-bold">{abbreviateRank(channel.other_user.rank)}</span>}
            <span className="truncate">{channel.display_name || channel.name}</span>
            {channel.is_owner && !channel.is_direct && (
              <Crown size={12} className="text-amber-500 ml-1.5 shrink-0" fill="currentColor" />
            )}
          </h3>
          {channel.last_message && (
            <span className="text-[10px] text-slate-400 ml-2 shrink-0">
              {new Date(channel.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className={`text-xs truncate pr-2 ${unread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
            {channel.last_message?.content || t('chat.no_messages')}
          </p>
          {unread > 0 && (
            <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-1 shadow-sm z-10">
        <button 
          onClick={(e) => { e.stopPropagation(); onMute(); }} 
          className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
          title={channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute')}
        >
          <BellOff size={14} fill={channel.mute_until && new Date(channel.mute_until) > new Date() ? "currentColor" : "none"} />
        </button>
        <button 
          onClick={(e) => onPin(e, channel.id)} 
          className="p-1 text-slate-400 hover:text-indigo-500 transition-colors"
          title={channel.is_pinned ? t('chat.unpin') : t('chat.pin')}
        >
          <Pin size={14} fill={channel.is_pinned ? "currentColor" : "none"} />
        </button>
        {(channel.created_by === currentUser?.id || currentUser?.role === 'admin') && (
          <button 
            onClick={(e) => onDelete(e, channel.id)} 
            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
            title={t('chat.deleteChat')}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ChannelSidebar);