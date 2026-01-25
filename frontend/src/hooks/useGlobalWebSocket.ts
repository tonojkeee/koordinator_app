import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useConnectionStore } from '../store/useConnectionStore';
import api from '../api/client';

interface GlobalWebSocketOptions {
    onChannelCreated?: (data: unknown) => void;
    onMessageReceived?: (data: unknown) => void;
    onMessageUpdated?: (data: unknown) => void;
    onChannelDeleted?: (data: unknown) => void;
    onDocumentShared?: (data: unknown) => void;
    onUserPresence?: (data: { user_id: number; status: 'online' | 'offline' }) => void;
    onTaskAssigned?: (data: { task_id: number; title: string; issuer_name: string }) => void;
    onTaskReturned?: (data: { task_id: number; title: string; sender_name: string }) => void;
    onTaskSubmitted?: (data: { task_id: number; title: string; sender_name: string }) => void;
    onTaskConfirmed?: (data: { task_id: number; title: string; sender_name: string }) => void;
}

// Singleton connection for global WebSocket to prevent duplicates in StrictMode
let globalConnection: { socket: WebSocket; refCount: number } | null = null;
let cleanupTimeout: ReturnType<typeof setTimeout> | null = null;

export const useGlobalWebSocket = (token: string | null, options: GlobalWebSocketOptions = {}) => {
    const [isConnected, setIsConnected] = useState(false);

    const onChannelCreatedRef = useRef(options.onChannelCreated);
    const onMessageReceivedRef = useRef(options.onMessageReceived);
    const onMessageUpdatedRef = useRef(options.onMessageUpdated);
    const onChannelDeletedRef = useRef(options.onChannelDeleted);
    const onDocumentSharedRef = useRef(options.onDocumentShared);
    const onUserPresenceRef = useRef(options.onUserPresence);
    const onTaskAssignedRef = useRef(options.onTaskAssigned);
    const onTaskReturnedRef = useRef(options.onTaskReturned);
    const onTaskSubmittedRef = useRef(options.onTaskSubmitted);
    const onTaskConfirmedRef = useRef(options.onTaskConfirmed);
    const reconnectAttemptRef = useRef(0);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        onChannelCreatedRef.current = options.onChannelCreated;
        onMessageReceivedRef.current = options.onMessageReceived;
        onMessageUpdatedRef.current = options.onMessageUpdated;
        onChannelDeletedRef.current = options.onChannelDeleted;
        onDocumentSharedRef.current = options.onDocumentShared;
        onUserPresenceRef.current = options.onUserPresence;
        onTaskAssignedRef.current = options.onTaskAssigned;
        onTaskReturnedRef.current = options.onTaskReturned;
        onTaskSubmittedRef.current = options.onTaskSubmitted;
        onTaskConfirmedRef.current = options.onTaskConfirmed;
    }, [options]);

    useEffect(() => {
        if (!token) {
            // Если токен стал null (выход из системы), закрываем соединение
            if (globalConnection) {
                console.log('🔌 Closing global WebSocket due to logout');
                if (globalConnection.socket.readyState === WebSocket.OPEN ||
                    globalConnection.socket.readyState === WebSocket.CONNECTING) {
                    globalConnection.socket.close(1000, 'User logged out');
                }
                globalConnection = null;
                setTimeout(() => {
                    setIsConnected(false);
                    useConnectionStore.getState().setIsConnected(false);
                }, 0);
            }
            return;
        }

        // Clear any pending cleanup
        if (cleanupTimeout) {
            clearTimeout(cleanupTimeout);
            cleanupTimeout = null;
        }

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'ping') return;

                if (data.type === 'channel_created' && onChannelCreatedRef.current) {
                    onChannelCreatedRef.current(data);
                } else if ((data.type === 'new_message' || data.type === 'message_received') && onMessageReceivedRef.current) {
                    onMessageReceivedRef.current(data);
                } else if (data.type === 'message_updated' && onMessageUpdatedRef.current) {
                    onMessageUpdatedRef.current(data);
                } else if (data.type === 'channel_deleted' && onChannelDeletedRef.current) {
                    onChannelDeletedRef.current(data);
                } else if (data.type === 'document_shared' && onDocumentSharedRef.current) {
                    onDocumentSharedRef.current(data);
                } else if (data.type === 'user_presence' && onUserPresenceRef.current) {
                    onUserPresenceRef.current(data);
                } else if (data.type === 'invitation_received') {
                    // Handle invitation notifications - just log for now, could add toast notification
                    console.log('📩 Invitation received:', data);
                    if (onMessageReceivedRef.current) {
                        onMessageReceivedRef.current(data);
                    }
                } else if (data.type === 'invitation_status_changed' && onMessageReceivedRef.current) {
                    // Handle invitation status changes through the message received callback
                    onMessageReceivedRef.current(data);
                } else if (data.type === 'new_task' && onTaskAssignedRef.current) {
                    onTaskAssignedRef.current(data);
                } else if (data.type === 'task_returned' && onTaskReturnedRef.current) {
                    onTaskReturnedRef.current(data);
                } else if (data.type === 'task_submitted' && onTaskSubmittedRef.current) {
                    onTaskSubmittedRef.current(data);
                } else if (data.type === 'task_confirmed' && onTaskConfirmedRef.current) {
                    onTaskConfirmedRef.current(data);
                }
            } catch (error) {
                console.error('❌ Failed to parse WebSocket message:', error);
            }
        };

        // Helper to check if token is expired or about to expire (within 1 minute)
        const isTokenExpired = (token: string): boolean => {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const exp = payload.exp * 1000; // Convert to milliseconds
                return Date.now() >= exp - 60000; // Expired or expiring within 1 minute
            } catch {
                return true; // If we can't decode, assume expired
            }
        };

        // Helper to refresh the token
        const refreshTokenIfNeeded = async (): Promise<string | null> => {
            if (!token) return null;

            if (!isTokenExpired(token)) {
                return token; // Token is still valid
            }

            console.log('🔄 Token expired or expiring soon, refreshing before WebSocket connect...');

            try {
                const storage = localStorage.getItem('auth-storage');
                if (!storage) return null;

                const data = JSON.parse(storage);
                const refreshToken = data.state?.refreshToken;

                if (!refreshToken) {
                    console.error('❌ No refresh token available');
                    useAuthStore.getState().clearAuth();
                    return null;
                }

                const apiBase = api.defaults.baseURL || import.meta.env.VITE_API_URL || '';
                const res = await fetch(`${apiBase}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: refreshToken }),
                    credentials: 'include'
                });

                if (!res.ok) {
                    console.error('❌ Token refresh failed');
                    useAuthStore.getState().clearAuth();
                    return null;
                }

                const { access_token, refresh_token: newRefreshToken } = await res.json();

                // Update localStorage
                data.state.token = access_token;
                data.state.refreshToken = newRefreshToken;
                localStorage.setItem('auth-storage', JSON.stringify(data));

                // Update Zustand store
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                    useAuthStore.getState().setAuth(currentUser, access_token, newRefreshToken);
                }

                console.log('✅ Token refreshed successfully');
                return access_token;
            } catch (error) {
                console.error('❌ Failed to refresh token:', error);
                useAuthStore.getState().clearAuth();
                return null;
            }
        };

        const connect = async () => {
            if (!token) return;

            // Check and refresh token if needed before connecting
            const validToken = await refreshTokenIfNeeded();
            if (!validToken) {
                console.log('❌ No valid token available, cannot connect WebSocket');
                return;
            }

            // If already connected or connecting, just increment refCount
            if (globalConnection && (globalConnection.socket.readyState === WebSocket.OPEN || globalConnection.socket.readyState === WebSocket.CONNECTING)) {
                globalConnection.refCount++;
                setIsConnected(globalConnection.socket.readyState === WebSocket.OPEN);
                globalConnection.socket.onmessage = handleMessage;
                return;
            }

            // Derive WS URL from API base URL to ensure consistency
            const apiBase = api.defaults.baseURL || import.meta.env.VITE_API_URL || '';
            const wsBase = apiBase.replace(/^http/, 'ws').replace('/api', '');
            const wsUrl = `${wsBase}/api/chat/ws/user?token=${validToken}`;
            const socket = new WebSocket(wsUrl);

            globalConnection = { socket, refCount: (globalConnection?.refCount || 0) + 1 };

            socket.onopen = () => {
                console.log('✅ Global WebSocket connected');
                setIsConnected(true);
                useConnectionStore.getState().setIsConnected(true);
                reconnectAttemptRef.current = 0;
            };

            socket.onmessage = handleMessage;

            socket.onclose = (event) => {
                console.log(`📡 Global WebSocket closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
                setIsConnected(false);
                useConnectionStore.getState().setIsConnected(false);

                // Important: Clear the global reference if it's THIS socket that closed
                if (globalConnection?.socket === socket) {
                    globalConnection = null;
                }

                // Check for Policy Violation (Invalid Token/Auth)
                if (event.code === 1008) {
                    console.error('❌ Global WebSocket Authentication Failed. Logging out.');
                    useAuthStore.getState().clearAuth();
                    return;
                }

                // Exponential backoff reconnection (max 30s)
                if (token && event.code !== 1000 && event.code !== 1001) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
                    console.log(`📡 Global WebSocket closed. Reconnecting in ${delay}ms... (Attempt ${reconnectAttemptRef.current + 1})`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptRef.current++;
                        connect();
                    }, delay);
                }
            };

            socket.onerror = (error) => {
                console.error('❌ Global WebSocket error:', error);
            };
        };

        connect();

        const handleOnline = () => {
            console.log('🌐 Network back online, forcing WebSocket reconnection...');
            // Force reset of current connection to ensure a fresh start
            if (globalConnection) {
                if (globalConnection.socket.readyState === WebSocket.OPEN ||
                    globalConnection.socket.readyState === WebSocket.CONNECTING) {
                    globalConnection.socket.close(4000, 'Network state change');
                }
                globalConnection = null;
            }
            reconnectAttemptRef.current = 0;
            connect();
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
            if (globalConnection) {
                globalConnection.refCount--;
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }

                cleanupTimeout = setTimeout(() => {
                    if (globalConnection && globalConnection.refCount <= 0) {
                        if (globalConnection.socket.readyState === WebSocket.OPEN ||
                            globalConnection.socket.readyState === WebSocket.CONNECTING) {
                            globalConnection.socket.close(1000, 'Normal Closure');
                        }
                        globalConnection = null;
                    }
                }, 500);
            }
        };
    }, [token, isConnected]);

    return { isConnected };
};
