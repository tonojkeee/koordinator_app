import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { LogIn, AlertCircle, Settings, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useConfigStore } from '../../store/useConfigStore';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../../design-system';

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
        api.get('/auth/csrf-token').then(() => {}).finally(() => {
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

            const { access_token } = loginRes.data;

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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Professional Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: `radial-gradient(var(--teams-brand) 0.5px, transparent 0.5px)`,
                backgroundSize: '32px 32px'
            }} />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/3 via-transparent to-primary/3" />

            {/* Connection Settings Trigger */}
            <button
                onClick={() => setShowSetup(true)}
                className="absolute top-6 right-6 p-2.5 text-muted-foreground hover:text-primary hover:bg-surface-2 rounded-lg transition-all duration-[var(--duration-fast)] z-20 active:scale-90 shadow-subtle border border-border bg-surface/50 backdrop-blur-md"
                title={t('auth.setup_connection_tooltip')}
            >
                <Settings size={20} strokeWidth={2.5} />
            </button>

            <div className="w-full max-w-[440px] relative z-10 p-4 animate-scale-in">
                <Card className="p-10 shadow-strong border-border/60 bg-surface/90 backdrop-blur-xl rounded-lg">
                    <div className="text-center mb-10">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-lg bg-primary mb-6 shadow-subtle transform transition-transform hover:scale-110 duration-[var(--duration-slow)]">
                            <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        </div>
                        <h2 className="text-3xl font-black text-secondary uppercase mb-2" style={{ letterSpacing: '-0.02em' }}>
                            {t('auth.signInTitle')}
                        </h2>
                        <p className="text-tertiary font-bold text-sm opacity-80 uppercase tracking-[0.15em]">
                            {t('auth.loginPrompt')}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-danger/5 border border-danger/20 p-4 rounded-lg flex items-start space-x-3 text-danger animate-slide-up">
                                <AlertCircle className="shrink-0 mt-0.5" size={18} strokeWidth={2.5} />
                                <p className="text-xs font-black uppercase tracking-tight leading-tight">{error}</p>
                            </div>
                        )}

                        <div className="space-y-5">
                            <Input
                                label={t('common.username')}
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('auth.enterUsername')}
                                leftIcon={<User size={18} strokeWidth={2.5} />}
                                fullWidth
                                className="bg-surface-2 border-border/50 focus:bg-surface"
                            />

                            <Input
                                label={t('common.password')}
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                leftIcon={<Lock size={18} strokeWidth={2.5} />}
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-muted-foreground hover:text-primary transition-colors focus:outline-none p-1"
                                    >
                                        {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
                                    </button>
                                }
                                fullWidth
                                className="bg-surface-2 border-border/50 focus:bg-surface"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !username || !password}
                            variant="primary"
                            size="lg"
                            className="w-full font-black uppercase tracking-[0.2em] text-xs shadow-subtle py-7 rounded-lg mt-8 transition-all duration-[var(--duration-normal)] hover:scale-[1.02] hover:shadow-medium active:scale-[0.98] active:shadow-subtle hover:translate-y-[-1px] active:translate-y-[1px]"
                            loading={loading}
                            icon={<LogIn size={18} strokeWidth={2.5} />}
                            iconPosition="right"
                        >
                            {t('auth.signInButton')}
                        </Button>
                    </form>

                    {registrationAllowed && (
                        <div className="mt-10 text-center border-t border-border/40 pt-8">
                            <p className="text-[11px] font-black text-tertiary uppercase tracking-widest opacity-70">
                                {t('auth.noAccount')}
                            </p>
                            <Link
                                to="/register"
                                className="inline-block mt-3 text-primary font-black uppercase tracking-[0.15em] text-[10px] hover:text-primary/80 transition-colors duration-[var(--duration-fast)] border-b-2 border-primary/20 hover:border-primary/40"
                            >
                                {t('auth.signUp')}
                            </Link>
                        </div>
                    )}

                {/* Footer Info */}
                <div className="mt-8 text-center opacity-30 group">
                    <p className="text-[9px] font-black text-tertiary uppercase tracking-[0.4em] transition-opacity duration-[var(--duration-normal)] group-hover:opacity-100">
                        Coordinator System &bull; Secured Enterprise Edition
                    </p>
                </div>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
