import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { LogIn, AlertCircle, Settings, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';
import { useTranslation } from 'react-i18next';


const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation();
    const setAuth = useAuthStore((state) => state.setAuth);
    const navigate = useNavigate();
    const setShowSetup = useConfigStore((state) => state.setShowSetup);


    const [registrationAllowed, setRegistrationAllowed] = useState(true);

    useEffect(() => {
        // Fetch CSRF token first to ensure it's available for non-GET requests
        api.get('/auth/csrf-token').then(() => {
            // setCsrfToken was removed. Cookie is automatically handled.
            // setCsrfToken(res.data.csrf_token);
        }).finally(() => {
            api.get('/auth/config').then(res => {
                if (res.data.allow_registration === false) {
                    setRegistrationAllowed(false);
                }
            }).catch(() => { });
        });
    }, []);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const loginRes = await api.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const { access_token, csrf_token } = loginRes.data;

            // Сохраняем CSRF токен из ответа логина - removed manual save
            if (csrf_token) {
                // setCsrfToken(csrf_token);
                console.log('🔐 CSRF token received in login response');
            }

            const userRes = await api.get('/auth/me', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });

            setAuth(userRes.data, access_token);
            navigate('/');
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail: string }>;
            setError(error.response?.data?.detail || t('auth.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F0F0F0]">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[#F0F0F0]" style={{ backgroundImage: 'radial-gradient(#E0E0E0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Connection Settings Trigger */}
            <button
                onClick={() => setShowSetup(true)}
                className="absolute top-4 right-4 p-2 text-[#616161] hover:text-[#242424] transition-colors z-20"
                title={t('auth.setup_connection_tooltip')}
            >
                <Settings size={20} />
            </button>

            <div className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-lg shadow-xl relative z-10 p-8 m-4">
                <div className="text-center mb-8">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-[#5B5FC7] mb-4 shadow-sm">
                        <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#242424]">
                        {t('auth.signInTitle')}
                    </h2>
                    <p className="mt-2 text-sm text-[#616161]">
                        {t('auth.loginPrompt')}
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-[#C4314B]/10 border border-[#C4314B]/20 p-3 rounded-md flex items-start space-x-3 text-[#C4314B]">
                            <AlertCircle className="shrink-0" size={18} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wide mb-1.5">
                                {t('common.username')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-[#888888] group-focus-within:text-[#5B5FC7] transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-10 pl-10 pr-4 bg-[#F5F5F5] border border-transparent rounded-md text-[#242424] placeholder-[#888888] focus:outline-none focus:bg-white focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] transition-all text-sm"
                                    placeholder={t('auth.enterUsername')}
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wide mb-1.5">
                                {t('common.password')}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-[#888888] group-focus-within:text-[#5B5FC7] transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full h-10 pl-10 pr-10 bg-[#F5F5F5] border border-transparent rounded-md text-[#242424] placeholder-[#888888] focus:outline-none focus:bg-white focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] transition-all text-sm"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888888] hover:text-[#5B5FC7] transition-colors focus:outline-none"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 flex items-center justify-center bg-[#5B5FC7] text-white text-sm font-bold rounded-md hover:bg-[#4f52b2] active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <span className="flex items-center space-x-2">
                                <span>{t('auth.signInButton')}</span>
                                <LogIn size={16} />
                            </span>
                        )}
                    </button>
                </form>

                {registrationAllowed && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-[#616161]">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className="text-[#5B5FC7] font-bold hover:underline">
                                {t('auth.signUp')}
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Internal Loader
const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

export default LoginPage;
