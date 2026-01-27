import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X, Clock, User, Calendar, Lock } from 'lucide-react';
import { channelInvitationsApi, type ChannelInvitation } from '../../api/channelInvitations';

interface InvitationsListProps {
  onAccept?: () => void;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({ onAccept }) => {
  const [invitations, setInvitations] = useState<ChannelInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responding, setResponding] = useState<number | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await channelInvitationsApi.getMyInvitations();
      const pending = data.filter((inv) => inv.status === 'pending');
      setInvitations(pending);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (
    invitationId: number,
    action: 'accept' | 'decline'
  ) => {
    setResponding(invitationId);
    try {
      await channelInvitationsApi.respondToInvitation({
        invitation_id: invitationId,
        action,
      });

      // Удаляем из списка
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      if (action === 'accept') {
        // Инвалидируем кэш каналов при принятии приглашения
        queryClient.invalidateQueries({ queryKey: ['channels'] });
        // Также инвалидируем кэш участников для всех каналов
        queryClient.invalidateQueries({ queryKey: ['channel_members'] });
        // Инвалидируем кэш конкретного канала для обновления members_count
        queryClient.invalidateQueries({ queryKey: ['channel'] });
        onAccept?.();
      }
    } catch (error: unknown) {
      console.error('Error responding to invitation:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      alert((error as any).response?.data?.detail || 'Ошибка при обработке приглашения');
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Загрузка приглашений...</div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Lock className="h-12 w-12 mb-3 text-gray-400" />
        <p>У вас нет приглашений</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">
                {invitation.channel_name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{invitation.inviter_name}</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              <Clock className="h-3 w-3" />
              Ожидает
            </span>
          </div>

          {invitation.message && (
            <p className="text-sm text-gray-600 mb-3 p-2 bg-gray-50 rounded">
              "{invitation.message}"
            </p>
          )}

          {invitation.invitee_email && (
            <div className="text-sm text-gray-500 mb-3">
              Приглашение отправлено на: {invitation.invitee_email}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(invitation.created_at)}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleRespond(invitation.id, 'accept')}
              disabled={responding === invitation.id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="h-4 w-4" />
              {responding === invitation.id ? 'Обработка...' : 'Принять'}
            </button>
            <button
              onClick={() => handleRespond(invitation.id, 'decline')}
              disabled={responding === invitation.id}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="h-4 w-4" />
              {responding === invitation.id ? 'Обработка...' : 'Отклонить'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};