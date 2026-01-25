import axios, { type AxiosResponse, type InternalAxiosRequestConfig, AxiosError } from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true, // Required to send cookies (CSRF) in cross-origin requests
});

export const setBaseUrl = (url: string): void => {
    api.defaults.baseURL = url;
};

interface TokenData {
    token: string | null;
    refreshToken: string | null;
}

// Helper to get tokens from auth-storage
const getTokens = (): TokenData => {
    try {
        const storage = localStorage.getItem('auth-storage');
        if (storage) {
            const data = JSON.parse(storage);
            return {
                token: data.state?.token,
                refreshToken: data.state?.refreshToken
            };
        }
    } catch (e) {
        console.error('Error parsing auth-storage', e);
    }
    return { token: null, refreshToken: null };
};

// Helper to get CSRF token from cookies
const getCsrfToken = (): string | null => {
    // More robust cookie parsing
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrf_token') {
            const token = decodeURIComponent(value);
            console.log('🔐 CSRF token from cookie:', token ? 'present' : 'missing');
            return token;
        }
    }
    console.log('🔐 CSRF token cookie not found');
    console.log('🔐 Available cookies:', document.cookie);
    return null;
};

// Add request interceptor to include JWT token and CSRF token
api.interceptors.request.use((config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const { token } = getTokens();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Include CSRF token for state-changing methods
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
        // Всегда используем токен из cookie, так как сервер сравнивает именно с ним
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers['X-CSRF-Token'] = csrfToken;
            console.log('🔐 Adding CSRF token to request:', config.url, 'token:', csrfToken.substring(0, 10) + '...');
        } else {
            console.warn('🔐 No CSRF token available for request:', config.url);
        }
    }

    return config;
});

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

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
    (response: AxiosResponse): AxiosResponse => response,
    async (error: unknown): Promise<AxiosResponse> => {
        const axiosError = error as AxiosError;
        const originalRequest = axiosError.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (axiosError.response?.status === 403) {
            const detail = (axiosError.response.data as { detail?: string })?.detail;

            // Handle CSRF token missing/invalid
            if (detail === 'CSRF token missing' || detail === 'CSRF token invalid') {
                if (!originalRequest._retry) {
                    originalRequest._retry = true;
                    try {
                        // Fetch a new CSRF token
                        const res = await api.get('/auth/csrf-token');
                        if (res.data?.csrf_token) {
                            // setCsrfToken(res.data.csrf_token);
                            console.log('🔐 Got new CSRF token after 403 error');
                        }
                        // CSRF token is set in cookie, interceptor will pick it up on retry
                        return api(originalRequest);
                    } catch (e) {
                        return Promise.reject(e);
                    }
                }
            }

            // Only force logout if the account is actually blocked (verified by header)
            const isBlocked = axiosError.response.headers['x-account-blocked'] === 'true';

            if (isBlocked) {
                // If it's a login attempt, don't redirect, just let the page handle the error
                if (originalRequest.url?.includes('/auth/login')) {
                    return Promise.reject(error);
                }
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            // Otherwise, it's a normal "Access Denied" for a specific resource, just reject
            return Promise.reject(error);
        }

        if (axiosError.response?.status === 401 && !originalRequest._retry) {
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

            const { refreshToken } = getTokens();

            if (refreshToken) {
                try {
                    const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken });
                    const { access_token, refresh_token, csrf_token } = res.data;

                    // Сохраняем новый CSRF токен
                    if (csrf_token) {
                        // setCsrfToken(csrf_token);
                    }

                    // Update localStorage manually so next requests get it
                    const storage = JSON.parse(localStorage.getItem('auth-storage') || '{}');
                    if (storage.state) {
                        storage.state.token = access_token;
                        storage.state.refreshToken = refresh_token;
                        localStorage.setItem('auth-storage', JSON.stringify(storage));
                    }

                    processQueue(null, access_token);
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    localStorage.removeItem('auth-storage');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                localStorage.removeItem('auth-storage');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
