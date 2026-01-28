import { useState } from 'react';
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

function InviteModal({ isOpen, onClose, channelName, onInvite }: InviteModalProps) {
  const { t } = useTranslation();
  const [selectedUsers, setSelectedUsers] = useState<AutocompleteUser[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      return [];
    }
  };

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await onInvite(
        selectedUsers.map(u => u.id),
        inviteMessage.trim() || undefined
      );
      handleClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setInviteMessage('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div>
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
            {t('chat.invite_to_channel')}
          </h2>
          <p className="text-[10px] text-primary font-black uppercase tracking-[0.15em] mt-1 opacity-70">
            {channelName}
          </p>
        </div>
      }
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            onClick={handleClose}
            fullWidth
            className="font-black uppercase tracking-widest text-xs"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleInvite}
            disabled={selectedUsers.length === 0 || isLoading}
            fullWidth
            className="font-black uppercase tracking-widest text-xs shadow-m3-2"
          >
            {isLoading ? t('common.loading') : t('chat.send_invitation')}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 animate-scale-in">
            <p className="text-sm text-destructive font-bold">{error}</p>
          </div>
        )}

        {/* User selection with autocomplete */}
        <div className="bg-surface-2 p-1 rounded-2xl border border-border/50">
          <UserAutocomplete
            label={t('chat.search_users')}
            placeholder={t('chat.select_users')}
            selectedUsers={selectedUsers}
            onSelectionChange={setSelectedUsers}
            onSearch={searchUsers}
            disabled={isLoading}
          />
        </div>

        {/* Invitation message */}
        <div className="bg-surface p-1">
          <TextArea
            label={t('chat.invite_message')}
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder={t('chat.invite_message_placeholder')}
            rows={3}
            maxLength={500}
            fullWidth
            disabled={isLoading}
            className="rounded-xl border-border bg-surface-2 focus:bg-surface"
          />
        </div>
      </div>
    </Modal>
  );
}

export default InviteModal;