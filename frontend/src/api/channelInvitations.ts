import apiClient from './client';

export interface ChannelInvitation {
  id: number;
  channel_id: number;
  channel_name: string;
  invited_by: number;
  invited_by_name: string;
  invited_user_id: number | null;
  email: string | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInvitationRequest {
  channel_id: number;
  email?: string;
  user_id?: number;
  message?: string;
}

export interface RespondInvitationRequest {
  invitation_id: number;
  action: 'accept' | 'decline';
}

export const channelInvitationsApi = {
  // Создать приглашение
  createInvitation: async (data: CreateInvitationRequest) => {
    const response = await apiClient.post<ChannelInvitation>(
      '/channels/invitations',
      data
    );
    return response.data;
  },

  // Получить приглашения для текущего пользователя
  getMyInvitations: async () => {
    const response = await apiClient.get<ChannelInvitation[]>(
      '/channels/invitations/my'
    );
    return response.data;
  },

  // Получить приглашения для канала
  getChannelInvitations: async (channelId: number) => {
    const response = await apiClient.get<ChannelInvitation[]>(
      `/channels/${channelId}/invitations`
    );
    return response.data;
  },

  // Принять или отклонить приглашение
  respondToInvitation: async (data: RespondInvitationRequest) => {
    const response = await apiClient.post<ChannelInvitation>(
      '/channels/invitations/respond',
      data
    );
    return response.data;
  },

  // Отменить приглашение
  cancelInvitation: async (invitationId: number) => {
    const response = await apiClient.delete<{ message: string }>(
      `/channels/invitations/${invitationId}`
    );
    return response.data;
  },
};