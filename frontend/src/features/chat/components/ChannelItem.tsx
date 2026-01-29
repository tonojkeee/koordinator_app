import React from 'react';
import { Lock, Settings, Crown, Pin, BellOff, Trash2 } from 'lucide-react';
import type { Channel } from '../../../types';
import { Avatar, ContextMenu, type ContextMenuOption, cn } from '../../../design-system';
import { abbreviateRank } from '../../../utils/formatters';
import { renderMessageContent } from '../utils';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  unread: number;
  onClick: () => void;
  onPin: (e: React.MouseEvent, id: number) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  onMute: () => void;
  currentUser: { id: number; role: string } | null;
  t: (key: string) => string;
  isSystem?: boolean;
}

export const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isActive,
  unread,
  onClick,
  onPin,
  onDelete,
  onMute,
  currentUser,
  t,
  isSystem = false
}) => {
  const handleClick = () => {
    try {
      onClick();
    } catch (error) {
      console.error('Error in onClick handler for channel:', channel.id, error);
    }
  };

  const contextOptions: ContextMenuOption[] = [];

  if (!isSystem) {
    contextOptions.push({
      label: channel.is_pinned ? t('chat.unpin') : t('chat.pin'),
      icon: Pin,
      onClick: (e: React.MouseEvent) => onPin(e, channel.id)
    });
  }

  contextOptions.push({
    label: channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute'),
    icon: BellOff,
    onClick: () => onMute()
  });

  if (!isSystem && (channel.created_by === currentUser?.id || currentUser?.role === 'admin')) {
    contextOptions.push({
      label: t('chat.deleteChat'),
      icon: Trash2,
      variant: 'danger',
      onClick: (e: React.MouseEvent) => onDelete(e, channel.id)
    });
  }

  // --- Last Message Logic ---
  const lastMessage = channel.last_message;
  let lastMessageText = '';
  let lastMessageTime = '';

  if (lastMessage) {
    // If it's a file, maybe show [File] or similar? renderMessageContent usually handles text.
    // For preview, we want plain text if possible.
    // Simple truncation:
    const content = lastMessage.content || '';
    lastMessageText = content.startsWith('📎') ? t('chat.fileNotification.document') : content;

    // Format time: HH:MM if today, Date if older
    const date = new Date(lastMessage.created_at);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        lastMessageTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        lastMessageTime = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }

  return (
    <ContextMenu options={contextOptions}>
      <div
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-1.5 border-l-[3px] transition-all duration-200 group relative cursor-pointer",
          isActive
            ? "border-cyan-600 bg-cyan-50/60"
            : "border-transparent hover:bg-slate-50"
        )}
      >
        <div className="relative shrink-0">
          <Avatar
            src={channel.is_direct ? channel.other_user?.avatar_url : undefined}
            name={channel.display_name || channel.name}
            size="sm"
            className={cn(
              "transition-transform duration-200",
              isActive ? "ring-2 ring-cyan-100" : "ring-1 ring-slate-100"
            )}
          />
          {channel.visibility === 'private' && !channel.is_direct && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full flex items-center justify-center border border-white">
              <Lock size={6} className="text-white" />
            </div>
          )}
          {channel.is_system && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-slate-500 rounded-full flex items-center justify-center border border-white">
              <Settings size={6} className="text-white" />
            </div>
          )}
          {channel.is_direct && (
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-white rounded-full",
              channel.other_user?.is_online ? "bg-green-500" : "bg-slate-300"
            )} />
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          {/* Top Row: Name + Time */}
          <div className="flex justify-between items-baseline w-full">
            <div className="flex items-center gap-1.5 min-w-0">
                {channel.other_user?.rank && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    {abbreviateRank(channel.other_user.rank)}
                    </span>
                )}
                <span className={cn(
                    "truncate text-[13px]",
                    isActive ? "font-semibold text-cyan-900" : (unread > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700")
                )}>
                    {channel.display_name || channel.name}
                </span>
                {channel.is_owner && !channel.is_direct && !channel.is_system && (
                    <Crown size={10} className="text-amber-500 shrink-0" fill="currentColor" />
                )}
            </div>

            {lastMessageTime && (
                <span className="text-[10px] text-slate-400 tabular-nums shrink-0 ml-1">
                    {lastMessageTime}
                </span>
            )}
          </div>

          {/* Bottom Row: Last Message + Badge */}
          <div className="flex justify-between items-center w-full h-4">
             <span className={cn(
                 "text-[11px] truncate pr-2",
                 isActive ? "text-cyan-700/80" : "text-slate-500",
                 unread > 0 && "font-medium text-slate-700"
             )}>
                 {lastMessageText ? (
                     <>
                        {lastMessage?.sender_name && !channel.is_direct && (
                            <span className="font-medium mr-1">{lastMessage.sender_name}:</span>
                        )}
                        {renderMessageContent(lastMessageText, false)}
                     </>
                 ) : (
                     <span className="italic opacity-50">{t('chat.no_messages')}</span>
                 )}
             </span>

            {/* Unread Badge & Hover Actions */}
            <div className="flex items-center shrink-0">
              {unread > 0 ? (
                <span className="min-w-[16px] h-[16px] bg-cyan-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                  {unread > 99 ? '99+' : unread}
                </span>
              ) : (
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSystem && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onPin(e, channel.id); }}
                        className="text-slate-400 hover:text-cyan-600 transition-colors"
                        title={channel.is_pinned ? t('chat.unpin') : t('chat.pin')}
                    >
                        <Pin size={12} fill={channel.is_pinned ? "currentColor" : "none"} />
                    </button>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ContextMenu>
  );
};
