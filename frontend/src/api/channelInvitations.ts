import apiClient from './client';

export interface ChannelInvitation {
  id: number;
  channel_id: number;
  channel_name: string;
  channel_visibility: string;
  inviter_id: number;
  inviter_name: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';
  role: string;
  token: string;
  created_at: string;
  expires_at: string;
  responded_at: string | null;
}

export interface CreateInvitationRequest {
  channel_id: number;
  invitee_email: string;
  message?: string;
  role?: string;
  expires_hours?: number;
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
    const response = await apiClient.get<{ invitations: ChannelInvitation[] }>(
      '/chat/invitations/pending'
    );
    return response.data.invitations;
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
    if (data.action === 'accept') {
      const response = await apiClient.post<any>(
        '/chat/invitations/accept',
        { invitation_id: data.invitation_id }
      );
      return response.data;
    } else {
      const response = await apiClient.post<any>(
        '/chat/invitations/decline',
        { invitation_id: data.invitation_id }
      );
      return response.data;
    }
  },

  // Отменить приглашение
  cancelInvitation: async (invitationId: number) => {
    const response = await apiClient.delete<{ message: string }>(
      `/channels/invitations/${invitationId}`
    );
    return response.data;
  },
};