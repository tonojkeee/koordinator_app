import { Hash, Users, Bell, BellOff, Info, LogOut, Download, UserPlus, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatName } from '../../utils/formatters';
import { Header, cn } from '../../design-system';

import type { Channel, User } from '../../types';

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

  const getIcon = () => {
    if (channel?.is_direct && channel.other_user) {
      return (
        <span className="text-[10px] font-bold uppercase">
          {channel.other_user.full_name
            ? channel.other_user.full_name.split(' ').map((n: string) => n[0]).join('')
            : channel.other_user.username.slice(0, 2)
          }
        </span>
      );
    }
    if (channel?.is_system) return <Settings size={20} />;
    return <Hash size={20} />;
  };

  const getSubtitle = () => (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-500",
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
            <span className="text-slate-900">{channel?.members_count || 0}</span> {t('common.participants', { count: channel?.members_count || 0 })}
            {channel?.online_count ? (
              <>
                <span className="mx-1.5 opacity-30">|</span>
                <span className="text-green-600">{channel.online_count}</span> {t('chat.online')}
              </>
            ) : null}
          </>
        )}
      </span>
    </div>
  );

  return (
    <Header
      title={channel?.is_direct && channel.other_user
        ? formatName(channel.other_user.full_name, channel.other_user.username)
        : channel?.display_name || channel?.name || `${t('chat.channel')} ${channel?.id}`
      }
      subtitle={getSubtitle()}
      icon={getIcon()}
      iconColor="blue"
      sticky={true}
      className="px-6 pt-6 pb-2"
      actions={
        <div className="flex items-center gap-1">
          {channel?.visibility === 'private' && channel?.is_member && onOpenInviteModal && !channel?.is_system && (
            <button
              onClick={onOpenInviteModal}
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

          <div className="w-px h-6 bg-slate-200 mx-1" />

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
              onClick={onLeaveChannel}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95 ml-1"
              title={t('chat.leave_channel')}
            >
              <LogOut size={20} strokeWidth={2.2} />
            </button>
          )}
        </div>
      }
    />
  );
};

export default ChannelHeader;