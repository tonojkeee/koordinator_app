import { Hash, Users, Bell, BellOff, Info, LogOut, Download, UserPlus, Settings } from 'lucide-react';
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
  onOpenInviteModal,
  formatLastSeen
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="shrink-0 border-b border-[#E0E0E0] bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 h-[60px]">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-[#5B5FC7] shrink-0">
              {channel?.is_direct && channel.other_user ? (
                <span className="text-xs font-bold uppercase">
                  {channel.other_user.full_name
                    ? channel.other_user.full_name.split(' ').map((n: string) => n[0]).join('')
                    : channel.other_user.username.slice(0, 2)
                  }
                </span>
              ) : channel?.is_system ? (
                <Settings size={18} />
              ) : (
                <Hash size={18} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#242424] truncate flex items-center gap-2">
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
              <div className="flex items-center gap-2 text-xs text-[#616161]">
                <div className={`w-1.5 h-1.5 rounded-full ${channel?.is_direct
                  ? (isDmPartnerOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300')
                  : (isConnected ? 'bg-green-500' : 'bg-rose-500')
                  }`} />
                <span className="font-medium">
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
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${isMuted
                ? 'text-[#C4314B] hover:bg-rose-50'
                : 'text-[#616161] hover:text-[#5B5FC7] hover:bg-[#F5F5F5]'
                }`}
              title={isMuted ? t('chat.notifications.unmute') : t('chat.notifications.mute')}
            >
              {isMuted ? <BellOff size={18} strokeWidth={1.5} /> : <Bell size={18} strokeWidth={1.5} />}
            </button>

            {!channel?.is_system && (
              <button
                onClick={handleExportChat}
                className="w-8 h-8 flex items-center justify-center text-[#616161] hover:text-[#5B5FC7] hover:bg-[#F5F5F5] rounded-md transition-all"
                title={t('chat.export_history')}
              >
                <Download size={18} strokeWidth={1.5} />
              </button>
            )}

            <button
              className="w-8 h-8 flex items-center justify-center text-[#616161] hover:text-[#5B5FC7] hover:bg-[#F5F5F5] rounded-md transition-all"
              title={t('common.info')}
            >
              <Info size={18} strokeWidth={1.5} />
            </button>

            {channel && !channel.is_direct && !channel.is_system && (
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${showParticipants
                  ? 'bg-[#E0E7FF] text-[#5B5FC7]'
                  : 'text-[#616161] hover:text-[#5B5FC7] hover:bg-[#F5F5F5]'
                  }`}
                title={t('chat.participants')}
              >
                <Users size={18} strokeWidth={1.5} />
              </button>
            )}

            {channel && !channel.is_direct && !channel.is_system && channel.is_member && !channel.is_owner && (
              <button
                onClick={onLeaveChannel}
                className="w-8 h-8 flex items-center justify-center text-[#616161] hover:text-[#C4314B] hover:bg-rose-50 rounded-md transition-all"
                title={t('chat.leave_channel')}
              >
                <LogOut size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChannelHeader;