import axios, { type AxiosResponse, type InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
            return decodeURIComponent(value);
        }
    }
    return null;
};

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL as string) || '/api',
    withCredentials: true, // Required to send cookies (CSRF) in cross-origin requests
});

export const setBaseUrl = (url: string): void => {
    api.defaults.baseURL = url;
};

// Request Interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const { token } = useAuthStore.getState();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Include CSRF token for state-changing methods
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
        } else {
            console.warn('🔐 No CSRF token available for request:', config.url);
        }
    }

    return config;
});

// Response Interceptor - Handle Errors & Refresh
interface FailedRequest {
    resolve: (token: string | null) => void;
    reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: AxiosError): Promise<AxiosResponse> => {
        const axiosError = error;
        const originalRequest = axiosError.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 405 Method Not Allowed
        if (axiosError.response?.status === 405) {
            console.error('❌ Method Not Allowed (405) error at:', axiosError.config?.url);
            console.error('Current baseURL:', axiosError.config?.baseURL);
        }

        // Handle 403 Forbidden (CSRF or Blocked)
        if (axiosError.response?.status === 403) {
            const detail = (axiosError.response.data as { detail?: string })?.detail;
            const isBlocked = axiosError.response.headers['x-account-blocked'] === 'true';

            // Account Blocked -> Force Logout
            if (isBlocked) {
                if (!originalRequest.url?.includes('/auth/login')) {
                    useAuthStore.getState().clearAuth();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            // CSRF Retry
            if (detail === 'CSRF token missing' || detail === 'CSRF token invalid') {
                if (!originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        await api.get('/auth/csrf-token');
                        return api(originalRequest);
                    } catch (e) {
                        return Promise.reject(e);
                    }
                }
            }

            return Promise.reject(error);
        }

        // Handle 401 Unauthorized (Token Refresh)
        if (axiosError.response?.status === 401 && !originalRequest._retry) {
            // Avoid infinite loop if refresh endpoint itself returns 401
            if (originalRequest.url?.includes('/auth/refresh')) {
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const { user } = useAuthStore.getState();

            try {
                // Call refresh endpoint directly using axios to avoid interceptor loop
                // Refresh token is now in HttpOnly cookie, so we don't need to pass it in body
                const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`,
                    {}, // Empty body
                    { withCredentials: true } // Important for cookies
                );

                const { access_token } = res.data;

                if (user) {
                    useAuthStore.getState().setAuth(user, access_token);
                }

                processQueue(null, access_token);
                originalRequest.headers.Authorization = `Bearer ${access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
