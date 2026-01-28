import React from 'react';
import { Lock, Settings, Crown, Pin, BellOff, Trash2 } from 'lucide-react';
import type { Channel } from '../../../types';
import { Avatar, ContextMenu, type ContextMenuOption, cn } from '../../../design-system';
import { abbreviateRank } from '../../../utils/formatters';

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
      onClick: (e: any) => onPin(e, channel.id)
    });
  }

  contextOptions.push({
    label: channel.mute_until && new Date(channel.mute_until) > new Date() ? t('chat.notifications.unmute') : t('chat.notifications.mute'),
    icon: BellOff,
    onClick: onMute
  });

  if (!isSystem && (channel.created_by === currentUser?.id || currentUser?.role === 'admin')) {
    contextOptions.push({
      label: t('chat.deleteChat'),
      icon: Trash2,
      variant: 'danger',
      onClick: (e: any) => onDelete(e, channel.id)
    });
  }

  return (
    <ContextMenu options={contextOptions}>
      <div
        onClick={handleClick}
        className={cn(
          "group relative flex items-center px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200 mx-1",
          isActive
            ? "bg-blue-50 text-blue-900"
            : "hover:bg-slate-100/80 text-slate-600 hover:text-slate-900"
        )}
      >
        {/* Active Marker */}
        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-blue-600 rounded-full" />
        )}

        <div className="relative shrink-0 mr-2.5">
          <Avatar
            src={channel.is_direct ? channel.other_user?.avatar_url : undefined}
            name={channel.display_name || channel.name}
            size="xs"
            className={cn(
              "transition-transform duration-200",
              isActive ? "ring-1 ring-blue-200" : "ring-1 ring-slate-200"
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

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <div className={cn(
              "text-[13px] truncate flex items-center gap-1.5",
              isActive ? "font-semibold text-blue-900" : (unread > 0 ? "font-semibold text-slate-900" : "font-medium text-slate-700")
            )}>
              {channel.other_user?.rank && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {abbreviateRank(channel.other_user.rank)}
                </span>
              )}
              <span className="truncate">{channel.display_name || channel.name}</span>
              {channel.is_owner && !channel.is_direct && !channel.is_system && (
                <Crown size={10} className="text-amber-500 shrink-0" fill="currentColor" />
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unread > 0 && (
                <span className="shrink-0 min-w-[16px] h-[16px] bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}

              <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                {!isSystem && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPin(e, channel.id); }}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title={channel.is_pinned ? t('chat.unpin') : t('chat.pin')}
                  >
                    <Pin size={11} fill={channel.is_pinned ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ContextMenu>
  );
};
