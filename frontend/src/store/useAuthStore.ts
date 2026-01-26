import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    setAuth: (user: User, token: string) => void;
    updateUser: (user: User) => void;
    clearAuth: () => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set): AuthState => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setAuth: (user: User, token: string): void => {
                set({ user, token, isAuthenticated: true });
            },
            updateUser: (user: User): void => {
                set({ user });
            },
            clearAuth: (): void => {
                // Принудительно закрываем все WebSocket соединения при выходе
                console.log('🔌 Clearing auth - WebSocket connections will be closed');
                set({ user: null, token: null, isAuthenticated: false });
            },
            logout: async (): Promise<void> => {
                console.log('🚪 Starting logout process...');
                // Вызываем API logout для отключения WebSocket на сервере
                try {
                    const { token } = useAuthStore.getState();
                    if (token) {
                        console.log('🔐 Token available, calling logout API...');
                        // Импортируем api внутри функции, чтобы избежать циклических зависимостей
                        const { default: api } = await import('../api/client');
                        
                        // Попробуем получить CSRF токен, если его нет
                        try {
                            await api.post('/auth/logout');
                            console.log('✅ Logout API call successful');
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } catch (csrfError: any) {
                            console.error('❌ Logout API call failed:', csrfError);
                            // Если ошибка 403 из-за CSRF, попробуем получить новый токен
                            if (csrfError?.response?.status === 403) {
                                console.log('🔐 CSRF error during logout, trying to get new token...');
                                try {
                                    await api.get('/auth/csrf-token');
                                    console.log('🔐 Got new CSRF token, retrying logout...');
                                    // Повторяем попытку logout с новым CSRF токеном
                                    await api.post('/auth/logout');
                                    console.log('✅ Logout retry successful');
                                } catch (retryError) {
                                    console.error('❌ Logout retry failed:', retryError);
                                    // Продолжаем выход даже если повторная попытка не удалась
                                }
                            } else {
                                throw csrfError;
                            }
                        }
                    } else {
                        console.log('⚠️ No token available, skipping logout API call');
                    }
                } catch (error) {
                    console.error('❌ Logout API call failed:', error);
                    // Продолжаем выход даже если API вызов не удался
                }

                console.log('🔌 Logging out - WebSocket connections will be closed');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            // Persist everything except isAuthenticated which is derived
            partialize: (state): Partial<AuthState> => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);
