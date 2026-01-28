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
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full transition-all duration-500",
        channel?.is_direct
          ? (isDmPartnerOnline ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-muted-foreground/30')
          : (isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_8px_rgba(176,0,32,0.4)]')
      )} />
      <span className="font-bold text-muted-foreground opacity-80 tracking-tight">
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
  );

  return (
    <Header
      title={channel?.is_direct && channel.other_user
        ? formatName(channel.other_user.full_name, channel.other_user.username)
        : channel?.display_name || channel?.name || `${t('chat.channel')} ${channel?.id}`
      }
      subtitle={getSubtitle()}
      icon={getIcon()}
      iconColor="indigo"
      sticky={true}
      className="px-6 py-3"
      actions={
        <div className="flex items-center gap-1.5">
          {channel?.visibility === 'private' && channel?.is_member && onOpenInviteModal && !channel?.is_system && (
            <button
              onClick={onOpenInviteModal}
              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
              title="Пригласить участников"
            >
              <UserPlus size={19} strokeWidth={2} />
            </button>
          )}

          <button
            onClick={() => setIsMuteModalOpen(true)}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90",
              isMuted
                ? 'text-destructive bg-destructive/5 hover:bg-destructive/10'
                : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
            )}
            title={isMuted ? t('chat.notifications.unmute') : t('chat.notifications.mute')}
          >
            {isMuted ? <BellOff size={19} strokeWidth={2} /> : <Bell size={19} strokeWidth={2} />}
          </button>

          {!channel?.is_system && (
            <button
              onClick={handleExportChat}
              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
              title={t('chat.export_history')}
            >
              <Download size={19} strokeWidth={2} />
            </button>
          )}

          <button
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
            title={t('common.info')}
          >
            <Info size={19} strokeWidth={2} />
          </button>

          {channel && !channel.is_direct && !channel.is_system && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-sm border",
                showParticipants
                  ? 'bg-primary text-white border-primary shadow-m3-1'
                  : 'bg-surface text-muted-foreground border-border hover:border-primary/30 hover:text-primary'
              )}
              title={t('chat.participants')}
            >
              <Users size={19} strokeWidth={2} />
            </button>
          )}

          {channel && !channel.is_direct && !channel.is_system && channel.is_member && !channel.is_owner && (
            <button
              onClick={onLeaveChannel}
              className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all active:scale-90"
              title={t('chat.leave_channel')}
            >
              <LogOut size={19} strokeWidth={2} />
            </button>
          )}
        </div>
      }
    />
  );
};

export default ChannelHeader;