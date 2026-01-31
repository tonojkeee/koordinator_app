import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { AxiosError } from 'axios';
import { AlertCircle, ShieldCheck, Loader2, User, Lock, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Card } from '../../design-system';

const RegisterPage: React.FC = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [checkingConfig, setCheckingConfig] = useState(true);
    const [registrationAllowed, setRegistrationAllowed] = useState(true);

    useEffect(() => {
        api.get('/auth/csrf-token').then(() => {}).finally(() => {
            api.get('/auth/config').then(res => {
                if (res.data.allow_registration === false) {
                    setRegistrationAllowed(false);
                }
            }).finally(() => setCheckingConfig(false));
        });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('auth.passwordsDoNotMatch') || 'Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', {
                username: formData.username,
                full_name: formData.full_name || null,
                password: formData.password,
            });

            navigate('/login', { state: { message: t('auth.registrationSuccessful') || 'Registration successful! Please login.' } });
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail: string }>;
            setError(error.response?.data?.detail || t('auth.registrationFailed') || 'Something went wrong during registration.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingConfig) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 animate-fade-in">
                <Loader2 className="animate-spin text-primary" size={48} strokeWidth={3} />
                <p className="text-tertiary text-sm font-bold uppercase tracking-widest opacity-70">
                    {t('auth.checkingConfig') || 'Checking configuration...'}
                </p>
            </div>
        );
    }

    if (!registrationAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
                <Card className="max-w-md w-full p-10 text-center space-y-8 rounded-lg shadow-strong border-border/60">
                    <div className="w-20 h-20 bg-danger/10 rounded-lg flex items-center justify-center text-danger mx-auto shadow-subtle">
                        <AlertCircle size={48} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-secondary tracking-tight uppercase">{t('auth.registrationDisabled')}</h2>
                        <p className="text-tertiary font-bold leading-relaxed opacity-80">
                            {t('auth.contactAdminForAccount', 'Please contact an administrator to create an account.')}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/login')}
                        fullWidth
                        className="font-black uppercase tracking-widest text-xs py-6 rounded-lg shadow-subtle hover:shadow-medium hover:translate-y-[-1px] active:translate-y-[1px] transition-all duration-[var(--duration-normal)]"
                    >
                        {t('auth.backToLogin')}
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            {/* Professional Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40" style={{
                backgroundImage: `radial-gradient(var(--teams-brand) 0.5px, transparent 0.5px)`,
                backgroundSize: '32px 32px'
            }} />
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

            <div className="w-full max-w-[480px] relative z-10 p-4 animate-scale-in">
                <Card className="p-10 shadow-strong border-border/60 bg-surface/90 backdrop-blur-xl rounded-lg">
                    <div className="text-center mb-10">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-lg bg-primary mb-6 shadow-subtle transform transition-transform hover:scale-110 duration-[var(--duration-slow)]">
                            <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        </div>
                        <h2 className="text-3xl font-black text-secondary tracking-tighter uppercase mb-2">
                            {t('auth.createAccount') || 'Create Account'}
                        </h2>
                        <p className="text-tertiary font-bold text-sm opacity-80 uppercase tracking-widest">
                            {t('auth.registerPrompt')}
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
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="johndoe"
                                required
                                leftIcon={<User size={18} strokeWidth={2.5} />}
                                fullWidth
                                className="bg-surface-2 border-border/50 focus:bg-surface font-black tracking-tight"
                            />

                            <Input
                                label={t('common.fullNameOptional')}
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                leftIcon={<Type size={18} strokeWidth={2.5} />}
                                fullWidth
                                className="bg-surface-2 border-border/50 focus:bg-surface font-bold"
                            />

                            <Input
                                label={t('common.password')}
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                leftIcon={<Lock size={18} strokeWidth={2.5} />}
                                fullWidth
                                className="bg-surface-2 border-border/50 focus:bg-surface"
                            />

                            <Input
                                label={t('auth.confirmPassword') || 'Confirm Password'}
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                leftIcon={<ShieldCheck size={18} strokeWidth={2.5} />}
                                fullWidth
                                className="bg-surface-2 border-border/50 focus:bg-surface"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            size="lg"
                            className="w-full font-black uppercase tracking-[0.2em] text-xs shadow-subtle py-7 rounded-lg mt-8 transition-all duration-[var(--duration-normal)] hover:scale-[1.02] hover:shadow-medium hover:translate-y-[-1px] active:scale-[0.98] active:shadow-subtle active:translate-y-[1px]"
                            loading={loading}
                            icon={<ShieldCheck size={20} strokeWidth={2.5} />}
                            iconPosition="right"
                        >
                            {t('auth.registerButton')}
                        </Button>
                    </form>

                    <div className="mt-10 text-center border-t border-border/40 pt-8">
                        <p className="text-[11px] font-black text-tertiary uppercase tracking-widest opacity-70">
                            {t('auth.haveAccount')}
                        </p>
                        <Link
                            to="/login"
                            className="inline-block mt-3 text-primary font-black uppercase tracking-[0.15em] text-[10px] hover:text-primary/80 transition-colors duration-[var(--duration-fast)] border-b-2 border-primary/20 hover:border-primary/40"
                        >
                            {t('auth.loginButton')}
                        </Link>
                    </div>
                </Card>

                {/* Footer Info */}
                <div className="mt-8 text-center opacity-30 group">
                    <p className="text-[9px] font-black text-tertiary uppercase tracking-[0.4em] transition-opacity duration-[var(--duration-normal)] group-hover:opacity-100">
                        Coordinator System &bull; Secured Enterprise Edition
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
