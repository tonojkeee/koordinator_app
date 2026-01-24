import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { channelInvitationsApi } from '../../api/channelInvitations';
import { useGlobalWebSocket } from '../../hooks/useGlobalWebSocket';
import { useAuthStore } from '../../store/useAuthStore';

interface InvitationActionsProps {
  invitationId: number;
  onResponse?: (action: 'accept' | 'decline') => void;
}

// Глобальный реестр статусов приглашений для синхронизации между экземплярами компонента
const invitationStatusRegistry = new Map<number, 'accepted' | 'declined' | 'cancelled'>();

export const InvitationActions: React.FC<InvitationActionsProps> = ({
  invitationId,
  onResponse,
}) => {
  const [responding, setResponding] = useState<string | null>(null);
  const [status, setStatus] = useState<'accepted' | 'declined' | 'cancelled' | null>(() => 
    invitationStatusRegistry.get(invitationId) || null
  );
  const queryClient = useQueryClient();
  const { token } = useAuthStore();

  // Подписываемся на обновления статуса приглашений через WebSocket
  useGlobalWebSocket(token, {
    onMessageReceived: useCallback((data: any) => {
      // Обрабатываем изменения статуса приглашений
      if (data.type === 'invitation_status_changed' && data.invitation_id === invitationId) {
        const newStatus = data.status as 'accepted' | 'declined' | 'cancelled';
        
        // Обновляем глобальный реестр
        invitationStatusRegistry.set(invitationId, newStatus);
        
        // Обновляем локальное состояние
        setStatus(newStatus);
        
        // Сбрасываем состояние загрузки
        setResponding(null);
        
        // Инвалидируем кэши для обновления UI
        queryClient.invalidateQueries({ queryKey: ['channels'] });
        queryClient.invalidateQueries({ queryKey: ['channel_members'] });
        queryClient.invalidateQueries({ queryKey: ['channel'] });
        queryClient.invalidateQueries({ queryKey: ['invitations'] });
        
        console.log(`Приглашение ${invitationId} было ${newStatus}`);
      }
    }, [invitationId, queryClient])
  });

  const handleAction = useCallback(async (action: 'accept' | 'decline') => {
    // Предотвращаем повторные клики во время обработки
    if (responding !== null || status !== null) {
      return;
    }

    setResponding(action);
    
    // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: сразу устанавливаем статус
    // Это предотвращает повторные клики до ответа сервера
    const optimisticStatus = action === 'accept' ? 'accepted' : 'declined';
    setStatus(optimisticStatus);
    invitationStatusRegistry.set(invitationId, optimisticStatus);
    
    try {
      await channelInvitationsApi.respondToInvitation({
        invitation_id: invitationId,
        action,
      });
      
      onResponse?.(action);
      
      // Инвалидируем кэш каналов при принятии приглашения
      if (action === 'accept') {
        queryClient.invalidateQueries({ queryKey: ['channels'] });
        queryClient.invalidateQueries({ queryKey: ['channel_members'] });
        queryClient.invalidateQueries({ queryKey: ['channel'] });
        console.log('Приглашение принято');
      } else {
        console.log('Приглашение отклонено');
      }
    } catch (error: any) {
      console.error('Error responding to invitation:', error);
      
      // ОТКАТ: если ошибка, возвращаем предыдущее состояние
      setStatus(null);
      invitationStatusRegistry.delete(invitationId);
      
      // Показываем ошибку пользователю
      const errorMessage = error.response?.data?.detail || 'Ошибка при обработке приглашения';
      alert(errorMessage);
    } finally {
      setResponding(null);
    }
  }, [invitationId, responding, status, queryClient, onResponse]);

  // Если приглашение уже обработано, показываем финальный статус
  if (status !== null) {
    const statusConfig = {
      accepted: {
        message: '✓ Приглашение принято',
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      declined: {
        message: '✗ Приглашение отклонено',
        className: 'bg-red-50 text-red-700 border-red-200'
      },
      cancelled: {
        message: '✕ Приглашение отменено',
        className: 'bg-gray-50 text-gray-600 border-gray-200'
      }
    };

    const config = statusConfig[status];
    
    return (
      <div className={`mt-2 p-2 rounded text-sm border ${config.className}`}>
        {config.message}
      </div>
    );
  }

  // Показываем кнопки, только если приглашение не обработано
  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={() => handleAction('accept')}
        disabled={responding !== null}
        className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <Check className="h-3 w-3" />
        {responding === 'accept' ? 'Принимаю...' : 'Принять'}
      </button>
      <button
        onClick={() => handleAction('decline')}
        disabled={responding !== null}
        className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <X className="h-3 w-3" />
        {responding === 'decline' ? 'Отклоняю...' : 'Отклонить'}
      </button>
    </div>
  );
};
