import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import { Modal, Button, Avatar } from '../../../design-system';
import { Crown, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { abbreviateRank, formatName } from '../../../utils/formatters';
import OwnerIndicator from './OwnerIndicator';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: number;
  onTransfer: (newOwnerId: number) => void;
  currentOwnerId: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentUser: any; // User type
}

interface UserBasicInfo {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  rank?: string;
  is_online?: boolean;
  last_seen?: string;
}

const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  isOpen,
  onClose,
  channelId,
  onTransfer,
  currentOwnerId,
  currentUser
}) => {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const { data: members, isLoading } = useQuery<UserBasicInfo[]>({
    queryKey: ['channel_members', String(channelId)],
    queryFn: async () => {
      const res = await api.get(`/chat/channels/${channelId}/members`);
      // Фильтруем текущего владельца и текущего пользователя
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data.filter((member: any) => member.id !== currentOwnerId && member.id !== currentUser?.id);
    },
    enabled: isOpen && !!channelId,
  });

  const handleTransfer = () => {
    if (selectedUserId) {
      onTransfer(selectedUserId);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setSelectedUserId(null), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('chat.transferOwnership.title')}
      className="max-w-md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          {t('chat.transferOwnership.description')}
        </p>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : members && members.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {members.map(member => (
              <div
                key={member.id}
                onClick={() => setSelectedUserId(member.id)}
                className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all ${
                  selectedUserId === member.id
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-slate-50'
                }`}
              >
                <Avatar
                  src={member.avatar_url}
                  name={member.full_name || member.username}
                  size="sm"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {member.rank && <span className="text-slate-400 mr-1 font-bold">{abbreviateRank(member.rank)}</span>}
                      {formatName(member.full_name, member.username)}
                    </span>
                    {member.id === currentOwnerId && (
                      <OwnerIndicator size="sm" className="ml-2" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">@{member.username}</span>
                </div>
                {selectedUserId === member.id && (
                  <Crown className="text-indigo-600" size={20} fill="currentColor" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>{t('chat.transferOwnership.noEligibleMembers')}</p>
          </div>
        )}
      </div>

      <div className="flex space-x-3 pt-6">
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleTransfer}
          disabled={!selectedUserId || isLoading}
        >
          {t('chat.transferOwnership.confirmButton')}
        </Button>
      </div>
    </Modal>
  );
};

export default TransferOwnershipModal;