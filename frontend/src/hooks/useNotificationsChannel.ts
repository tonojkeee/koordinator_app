import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';
import type { Channel } from '../types';

/**
 * Hook to automatically connect to the user's notifications channel
 * This ensures system messages (like invitations) are received in real-time
 */
export const useNotificationsChannel = (onMessage?: (data: unknown) => void) => {
    const { token } = useAuthStore();

    // Fetch user's channels to find the notifications channel
    const { data: channels } = useQuery<Channel[]>({
        queryKey: ['channels'],
        queryFn: async () => {
            const res = await api.get('/chat/channels');
            return res.data;
        },
        enabled: !!token,
    });

    // Find the notifications channel (system channel with name "notifications")
    const notificationsChannel = channels?.find(
        channel => channel.is_system && channel.name === 'notifications'
    );

    // Connect to notifications channel via WebSocket
    const { isConnected } = useWebSocket(
        notificationsChannel?.id,
        token,
        { onMessage }
    );

    return {
        notificationsChannelId: notificationsChannel?.id,
        isConnectedToNotifications: isConnected
    };
};