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

            const { access_token, refresh_token, csrf_token } = loginRes.data;

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

            setAuth(userRes.data, access_token, refresh_token);
            navigate('/');
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail: string }>;
            setError(error.response?.data?.detail || t('auth.loginFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 p-4">
            {/* Connection Settings Trigger */}
            <button
                onClick={() => setShowSetup(true)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all z-20"
                title={t('auth.setup_connection_tooltip')}
            >
                <Settings size={24} />
            </button>

            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

            {/* Split Card Container */}
            <div className="w-full max-w-4xl bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row relative z-10 animate-in">

                {/* Left Panel (Brand/Visual) */}
                <div className="hidden sm:flex w-1/2 bg-slate-900/40 relative flex-col items-center justify-center p-12 text-center border-r border-white/5">
                    {/* Decorative pattern/circles */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />

                    {/* Abstract Shapes */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] border-[40px] border-indigo-500/10 rounded-full blur-3xl" />
                        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-500/20 rounded-full blur-2xl" />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative group/logo mb-8 cursor-default">
                            {/* Always rotating elegant ring */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-60">
                                <div
                                    className="w-[100px] h-[100px] rounded-3xl animate-spin-slow border border-indigo-500/30"
                                    style={{
                                        background: 'conic-gradient(from 0deg, transparent, rgba(99,102,241,0.3), transparent)',
                                        animationDuration: '10s'
                                    }}
                                />
                            </div>

                            {/* Always pulsing subtle glow */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 animate-pulse" />
                            </div>

                            {/* Logo Container */}
                            <div className="relative w-24 h-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center p-5 shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-indigo-500/20">
                                {/* Inner subtle glow */}
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50" />

                                <img
                                    src="/icon.png"
                                    alt="GIS Coordinator"
                                    className="w-full h-full object-contain drop-shadow-lg"
                                />
                            </div>
                        </div>

                        <div className="animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
                            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">{t('auth.welcomeBack')}</h2>
                            <p className="text-slate-400 mb-10 max-w-xs mx-auto leading-relaxed">
                                {t('auth.loginPrompt')}
                            </p>
                        </div>

                        {registrationAllowed && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                                <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest block opacity-80">{t('auth.noAccount')}</span>
                                <Link
                                    to="/register"
                                    className="inline-block px-10 py-3.5 border border-white/20 bg-white/5 backdrop-blur-md rounded-2xl text-white font-bold hover:bg-white/10 hover:border-white/40 hover:scale-105 transition-all duration-300 shadow-xl"
                                >
                                    {t('auth.signUp')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel (Form) */}
                <div className="w-full sm:w-1/2 p-8 sm:p-12 bg-slate-800/80 flex flex-col justify-center">
                    <div className="text-center sm:text-left mb-8">
                        <div className="sm:hidden mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-indigo-600 mb-6 shadow-lg">
                            <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight text-center sm:text-left">
                            {t('auth.signInTitle')}
                        </h2>
                        {/* Mobile-only switch link */}
                        <p className="mt-2 text-slate-400 text-sm sm:hidden text-center">
                            {registrationAllowed && (
                                <>
                                    {t('auth.noAccount')}{' '}
                                    <Link to="/register" className="text-indigo-400 font-bold hover:underline">
                                        {t('auth.registerLink')}
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start space-x-3 text-rose-400 animate-in">
                                <AlertCircle className="shrink-0" size={18} />
                                <p className="text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">
                                    {t('common.username')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="w-full h-12 pl-11 pr-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                                        placeholder={t('auth.enterUsername')}
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">
                                    {t('common.password')}
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full h-12 pl-11 pr-11 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 flex items-center justify-center bg-indigo-600 text-white text-base font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-6"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <span className="flex items-center space-x-2">
                                    <span>{t('auth.signInButton')}</span>
                                    <LogIn size={18} />
                                </span>
                            )}
                        </button>
                    </form>
                </div>
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
