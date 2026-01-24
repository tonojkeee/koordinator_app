import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { InvitationsList } from '../components/chat/InvitationsList';

export const InvitationsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleAccept = () => {
    // Инвалидируем кэш каналов чтобы обновить список
    queryClient.invalidateQueries({ queryKey: ['channels'] });
    // Также инвалидируем кэш участников для всех каналов
    queryClient.invalidateQueries({ queryKey: ['channel_members'] });
    // Инвалидируем кэш конкретного канала для обновления members_count
    queryClient.invalidateQueries({ queryKey: ['channel'] });
    
    // Перенаправляем на главную страницу чата после принятия приглашения
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Приглашения в каналы
            </h1>
            <p className="text-gray-600 mt-1">
              Примите или отклоните приглашения в приватные каналы
            </p>
          </div>
        </div>

        {/* Список приглашений */}
        <InvitationsList onAccept={handleAccept} />
      </div>
    </div>
  );
};