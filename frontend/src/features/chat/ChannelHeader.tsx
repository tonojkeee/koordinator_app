import { useState } from 'react';
import { Hash, Users, Bell, BellOff, Info, LogOut, Search, Download, UserPlus, UserCheck, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatName } from '../../utils/formatters';
import OwnerIndicator from './components/OwnerIndicator';

import type { Channel, User } from '../../types';

interface InviteButtonProps {
  onClick: () => void;
}
const InviteButton: React.FC<InviteButtonProps> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
    title="Пригласить участников"
  >
    <UserPlus size={18} />
  </button>
);

interface ChannelHeaderProps {
  channel: Channel & { is_direct?: boolean; other_user?: User; display_name?: string; name?: string; is_owner?: boolean; is_member?: boolean; members_count?: number; online_count?: number; visibility?: 'public' | 'private'; is_system?: boolean };
  isConnected: boolean;
  isMuted: boolean;
  isDmPartnerOnline: boolean;
  dmPartner: User;
  showParticipants: boolean;
  setShowParticipants: (show: boolean) => void;
  setIsMuteModalOpen: (open: boolean) => void;
  handleExportChat: () => void;
  onLeaveChannel: () => void;
  onInvite?: (userIds: string[], message?: string) => Promise<void>;
  onOpenInviteModal?: () => void;
  formatLastSeen: (lastSeen: string | null | undefined) => string;
}

const ChannelHeader: React.FC<ChannelHeaderProps> = ({
  channel,
  isConnected,
  isMuted,
  isDmPartnerOnline,
  dmPartner,
  showParticipants,
  setShowParticipants,
  setIsMuteModalOpen,
  handleExportChat,
  onLeaveChannel,
  onInvite,
  onOpenInviteModal,
  formatLastSeen
}) => {
  const { t } = useTranslation();

  const handleInvite = async (userIds: string[], message?: string) => {
    if (onInvite) {
      await onInvite(userIds, message);
    }
  };

  return (
    <>
      <div className="shrink-0 border-b border-slate-200/50 bg-white/40 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
              {channel?.is_direct && channel.other_user ? (
                <span className="text-sm font-bold uppercase">
                  {channel.other_user.full_name
                    ? channel.other_user.full_name.split(' ').map((n: string) => n[0]).join('')
                    : channel.other_user.username.slice(0, 2)
                  }
                </span>
              ) : channel?.is_system ? (
                <Settings size={20} />
              ) : (
                <Hash size={20} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900 truncate flex items-center gap-2">
                {channel?.is_direct && channel.other_user
                  ? formatName(channel.other_user.full_name, channel.other_user.username)
                  : channel?.display_name || channel?.name || `${t('chat.channel')} ${channel?.id}`
                }
                {channel?.visibility === 'private' && !channel?.is_direct && !channel?.is_system && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                    <Users size={12} />
                    <span className="text-slate-400">{t('chat.private_channel')}</span>
                  </span>
                )}
                {channel?.is_owner && !channel?.is_direct && (
                  <OwnerIndicator size="sm" tooltip={t('chat.youAreOwner')} />
                )}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className={`w-1.5 h-1.5 rounded-full ${channel?.is_direct
                  ? (isDmPartnerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300')
                  : (isConnected ? 'bg-emerald-500' : 'bg-rose-500')
                }`} />
                <span className="font-semibold">
                  {channel?.is_system ? (
                    t('chat.system_channel')
                  ) : channel?.is_direct ? (
                    isDmPartnerOnline ? t('chat.online') : formatLastSeen(dmPartner?.last_seen)
                  ) : (
                    t('chat.channelStatus', {
                      count: channel?.members_count || 0,
                      label: t('common.participants', { count: channel?.members_count || 0 }),
                      online: channel?.online_count || 0
                    })
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1">
            {channel?.visibility === 'private' && channel?.is_member && onOpenInviteModal && !channel?.is_system && (
              <InviteButton onClick={onOpenInviteModal} />
            )}

            <button
              onClick={() => setIsMuteModalOpen(true)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isMuted
                ? 'text-rose-500 hover:bg-rose-50'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isMuted ? t('chat.notifications.unmute') : t('chat.notifications.mute')}
            >
              {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
            </button>

            {!channel?.is_system && (
              <button
                onClick={handleExportChat}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
                title={t('chat.export_history')}
              >
                <Download size={18} />
              </button>
            )}

            <button
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
              title={t('common.info')}
            >
              <Info size={18} />
            </button>

            {channel && !channel.is_direct && !channel.is_system && (
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${showParticipants
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                title={t('chat.participants')}
              >
                <Users size={18} />
              </button>
            )}

            {channel && !channel.is_direct && !channel.is_system && channel.is_member && !channel.is_owner && (
              <button
                onClick={onLeaveChannel}
                className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                title={t('chat.leave_channel')}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChannelHeader;