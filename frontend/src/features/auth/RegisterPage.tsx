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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-primary" size={48} strokeWidth={3} />
            </div>
        );
    }

    if (!registrationAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-fade-in">
                <Card className="max-w-md w-full p-10 text-center space-y-8 rounded-[2.5rem] shadow-m3-4 border-border/60">
                    <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center text-destructive mx-auto shadow-inner">
                        <AlertCircle size={48} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">{t('auth.registrationDisabled')}</h2>
                        <p className="text-muted-foreground font-bold leading-relaxed opacity-70">
                            {t('auth.contactAdminForAccount', 'Please contact an administrator to create an account.')}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/login')}
                        fullWidth
                        className="font-black uppercase tracking-widest text-xs py-6 rounded-2xl shadow-m3-2"
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
                <Card className="p-10 shadow-m3-4 border-border/60 bg-surface/90 backdrop-blur-xl rounded-[2.5rem]">
                    <div className="text-center mb-10">
                        <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-primary mb-6 shadow-m3-2 transform transition-transform hover:scale-110 duration-500">
                            <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        </div>
                        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-2">
                            {t('auth.createAccount') || 'Create Account'}
                        </h2>
                        <p className="text-muted-foreground font-bold text-sm opacity-70 uppercase tracking-widest">
                            {t('auth.registerPrompt')}
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-destructive/5 border border-destructive/10 p-4 rounded-2xl flex items-start space-x-3 text-destructive animate-slide-up">
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
                            className="w-full font-black uppercase tracking-[0.2em] text-xs shadow-m3-2 py-7 rounded-2xl mt-8 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            loading={loading}
                            icon={<ShieldCheck size={20} strokeWidth={2.5} />}
                            iconPosition="right"
                        >
                            {t('auth.registerButton')}
                        </Button>
                    </form>

                    <div className="mt-10 text-center border-t border-border/40 pt-8">
                        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
                            {t('auth.haveAccount')}
                        </p>
                        <Link
                            to="/login"
                            className="inline-block mt-3 text-primary font-black uppercase tracking-[0.15em] text-[10px] hover:text-teams-brandHover transition-colors border-b-2 border-primary/20 hover:border-primary"
                        >
                            {t('auth.loginButton')}
                        </Link>
                    </div>
                </Card>

                {/* Footer Info */}
                <div className="mt-8 text-center opacity-30 group">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] transition-opacity group-hover:opacity-100">
                        Coordinator System &bull; Secured Enterprise Edition
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
