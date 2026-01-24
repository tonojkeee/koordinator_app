import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, TextArea, UserAutocomplete, type AutocompleteUser } from '../../../design-system';
import api from '../../../api/client';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  onInvite: (userIds: number[], message?: string) => void;
}

function InviteModal({ isOpen, onClose, channelId, channelName, onInvite }: InviteModalProps) {
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState<AutocompleteUser[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Search users function
  const searchUsers = async (query: string): Promise<AutocompleteUser[]> => {
    try {
      const response = await api.get('/auth/users');
      const allUsers = response.data;
      
      // Filter users based on search query
      const filtered = allUsers.filter((user: AutocompleteUser) => {
        const searchTerm = query.toLowerCase();
        const fullName = user.full_name?.toLowerCase() || '';
        const username = user.username.toLowerCase();
        const email = user.email?.toLowerCase() || '';
        
        return fullName.includes(searchTerm) || 
               username.includes(searchTerm) || 
               email.includes(searchTerm);
      });
      
      return filtered.slice(0, 10); // Limit to 10 results
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    setIsLoading(true);
    try {
      await onInvite(
        selectedUsers.map(u => u.id),
        inviteMessage.trim() || undefined
      );
      handleClose();
    } catch (error) {
      console.error('Error inviting users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setInviteMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {t('chat.invite_to_channel')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {channelName}
          </p>
        </div>
      }
      size="lg"
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
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 || isLoading}
            fullWidth
          >
            {isLoading ? t('common.loading') : t('chat.send_invitation')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* User selection with autocomplete */}
        <UserAutocomplete
          label={t('chat.search_users')}
          placeholder={t('chat.select_users')}
          selectedUsers={selectedUsers}
          onSelectionChange={setSelectedUsers}
          onSearch={searchUsers}
          disabled={isLoading}
        />

        {/* Invitation message */}
        <div>
          <TextArea
            label={t('chat.invite_message')}
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder={t('chat.invite_message_placeholder')}
            rows={3}
            maxLength={500}
            fullWidth
          />
        </div>
      </div>
    </Modal>
  );
}

export default InviteModal;