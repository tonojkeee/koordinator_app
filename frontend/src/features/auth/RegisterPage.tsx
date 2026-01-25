import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { AxiosError } from 'axios';
import { AlertCircle, ShieldCheck, Loader2, User, Lock, Eye, EyeOff, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';


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
        // Fetch CSRF token first to ensure it's available for non-GET requests
        api.get('/auth/csrf-token').then(res => {
            if (res.data?.csrf_token) {
                // setCsrfToken(res.data.csrf_token);
            }
        }).finally(() => {
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
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (!registrationAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
                <div className="max-w-md text-center space-y-4">
                    <AlertCircle size={48} className="mx-auto text-rose-500" />
                    <h2 className="text-2xl font-bold">{t('auth.registrationDisabled')}</h2>
                    <p className="text-slate-400">
                        {t('auth.contactAdminForAccount', 'Please contact an administrator to create an account.')}
                    </p>
                    <Link to="/login" className="inline-block mt-4 px-6 py-2 bg-indigo-600 rounded-xl font-bold">
                        {t('auth.backToLogin')}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 p-4">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />

            <div className="w-full max-w-4xl bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row relative z-10 animate-in">

                {/* Left Panel (Visual) */}
                <div className="hidden sm:flex w-1/2 bg-slate-900/40 relative flex-col items-center justify-center p-12 text-center border-r border-white/5">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />

                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] border-[40px] border-indigo-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-[20%] right-[20%] w-[20%] h-[20%] bg-indigo-500/20 rounded-full blur-2xl" />
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
                            <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">{t('auth.getStarted')}</h2>
                            <p className="text-slate-400 mb-10 max-w-xs mx-auto leading-relaxed">
                                {t('auth.registerPrompt')}
                            </p>
                        </div>

                        <div className="space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
                            <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest block opacity-80">{t('auth.haveAccount')}</span>
                            <Link
                                to="/login"
                                className="inline-block px-10 py-3.5 border border-white/20 bg-white/5 backdrop-blur-md rounded-2xl text-white font-bold hover:bg-white/10 hover:border-white/40 hover:scale-105 transition-all duration-300 shadow-xl"
                            >
                                {t('auth.loginButton')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Panel (Form) */}
                <div className="w-full sm:w-1/2 p-8 sm:p-12 bg-slate-800/80 flex flex-col justify-center">
                    <div className="text-center sm:text-left mb-8">
                        <div className="sm:hidden mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-indigo-600 mb-6 shadow-lg">
                            <img src="/icon.png" alt="Logo" className="w-10 h-10 object-contain brightness-0 invert" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight text-center sm:text-left">
                            {t('auth.createAccount') || 'Create Account'}
                        </h2>
                        <p className="mt-2 text-slate-400 text-sm sm:hidden text-center">
                            {t('auth.haveAccountShort') || 'Already have an account?'}{' '}
                            <Link to="/login" className="text-indigo-400 font-bold hover:underline">
                                {t('auth.loginLink')}
                            </Link>
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start space-x-3 text-rose-400 animate-in">
                                <AlertCircle className="shrink-0" size={18} />
                                <p className="text-sm font-semibold">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-3">
                                <FormGroup
                                    label={t('common.username')}
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="johndoe"
                                    required
                                    icon={<User className="h-4 w-4 sm:h-5 sm:w-5" />}
                                />
                                <FormGroup
                                    label={t('common.fullNameOptional')}
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    icon={<Type className="h-4 w-4 sm:h-5 sm:w-5" />}
                                />
                                <FormGroup
                                    label={t('common.password')}
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    icon={<Lock className="h-4 w-4 sm:h-5 sm:w-5" />}
                                    isPassword
                                />
                                <FormGroup
                                    label={t('auth.confirmPassword') || 'Confirm Password'}
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    icon={<Lock className="h-4 w-4 sm:h-5 sm:w-5" />}
                                    isPassword
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex flex-col space-y-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 flex items-center justify-center bg-indigo-600 text-white text-base font-bold rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <span className="flex items-center space-x-2">
                                        <span>{t('auth.registerButton')}</span>
                                        <ShieldCheck size={18} />
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

interface FormGroupProps {
    label: string;
    name: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    icon?: React.ReactNode;
    isPassword?: boolean;
}

const FormGroup = ({ label, name, type = "text", value, onChange, placeholder, required = false, icon, isPassword = false }: FormGroupProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
        <div>
            <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block ml-1">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    name={name}
                    type={inputType}
                    required={required}
                    className={`w-full h-10 sm:h-11 bg-slate-900/50 border border-slate-700/50 rounded-lg sm:rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm ${icon ? 'pl-10' : 'px-4'} ${isPassword ? 'pr-10' : 'pr-4'}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
