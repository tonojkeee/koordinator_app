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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F0F0F0]">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[#F0F0F0]" style={{ backgroundImage: 'radial-gradient(#E0E0E0 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="w-full max-w-md bg-white border border-[#E0E0E0] rounded-lg shadow-xl relative z-10 p-8 m-4">
                <div className="text-center mb-8">
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-lg bg-[#5B5FC7] mb-4 shadow-sm">
                        <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain brightness-0 invert" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#242424]">
                        {t('auth.createAccount') || 'Create Account'}
                    </h2>
                    <p className="mt-2 text-sm text-[#616161]">
                        {t('auth.registerPrompt')}
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
                        <FormGroup
                            label={t('common.username')}
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="johndoe"
                            required
                            icon={<User className="h-5 w-5" />}
                        />
                        <FormGroup
                            label={t('common.fullNameOptional')}
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            icon={<Type className="h-5 w-5" />}
                        />
                        <FormGroup
                            label={t('common.password')}
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            icon={<Lock className="h-5 w-5" />}
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
                            icon={<Lock className="h-5 w-5" />}
                            isPassword
                        />
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
                                <span>{t('auth.registerButton')}</span>
                                <ShieldCheck size={16} />
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-[#616161]">
                        {t('auth.haveAccount')}{' '}
                        <Link to="/login" className="text-[#5B5FC7] font-bold hover:underline">
                            {t('auth.loginButton')}
                        </Link>
                    </p>
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
            <label className="block text-xs font-bold text-[#616161] uppercase tracking-wide mb-1.5">
                {label}
            </label>
            <div className="relative group">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#888888] group-focus-within:text-[#5B5FC7] transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    name={name}
                    type={inputType}
                    required={required}
                    className={`w-full h-10 bg-[#F5F5F5] border border-transparent rounded-md text-[#242424] placeholder-[#888888] focus:outline-none focus:bg-white focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] transition-all text-sm ${icon ? 'pl-10' : 'px-4'} ${isPassword ? 'pr-10' : 'pr-4'}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888888] hover:text-[#5B5FC7] transition-colors focus:outline-none"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
