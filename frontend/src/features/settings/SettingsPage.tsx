import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Bell, Lock, Eye, Shield, Briefcase, Calendar, Server, Settings as SettingsIcon, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import { AxiosError } from 'axios';
import { useToast } from '../../design-system';

import { Avatar } from '../../design-system';
import { Header, Modal, Input, Button } from '../../design-system';
import { COMMON_TIMEZONES } from '../../utils/timezone';

const SettingsPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuthStore();
    const { addToast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [availableTimezones, setAvailableTimezones] = React.useState<string[]>([]);
    const [timezonesLoading, setTimezonesLoading] = React.useState(false);

    // Fetch available timezones
    React.useEffect(() => {
        const fetchTimezones = async () => {
            try {
                setTimezonesLoading(true);
                const res = await api.get('/auth/timezones');
                setAvailableTimezones(res.data);
            } catch (error) {
                console.error('Failed to fetch timezones:', error);
                // Fallback to common timezones
                setAvailableTimezones(COMMON_TIMEZONES.map(tz => tz.value));
            } finally {
                setTimezonesLoading(false);
            }
        };
        fetchTimezones();
    }, []);

    const [activeSection, setActiveSection] = React.useState<string | null>(null);
    const [formData, setFormData] = React.useState({
        full_name: user?.full_name || '',
        phone_number: user?.phone_number || '',
        cabinet: user?.cabinet || '',
        rank: user?.rank || '',
        position: user?.position || '',
        birth_date: user?.birth_date ? new Date(user.birth_date).toISOString().split('T')[0] : '',
    });

    const [generalFormData, setGeneralFormData] = React.useState({
        timezone: user?.timezone || 'UTC',
        preferences: {
            start_page: user?.preferences?.start_page || 'chat',
            enter_to_send: user?.preferences?.enter_to_send ?? true,
            font_size: user?.preferences?.font_size || 14,
            tasks_view: user?.preferences?.tasks_view || 'list',
        }
    });

    const [notificationFormData, setNotificationFormData] = React.useState({
        notify_browser: user?.notify_browser ?? true,
        notify_sound: user?.notify_sound ?? true,
        notify_email: user?.notify_email ?? false,
    });

    React.useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone_number: user.phone_number || '',
                cabinet: user.cabinet || '',
                rank: user.rank || '',
                position: user.position || '',
                birth_date: user.birth_date ? new Date(user.birth_date).toISOString().split('T')[0] : '',
            });
            setGeneralFormData({
                timezone: user.timezone || 'UTC',
                preferences: {
                    start_page: user.preferences?.start_page || 'chat',
                    enter_to_send: user.preferences?.enter_to_send ?? true,
                    font_size: user.preferences?.font_size || 14,
                    tasks_view: user.preferences?.tasks_view || 'list',
                }
            });
            setNotificationFormData({
                notify_browser: user.notify_browser ?? true,
                notify_sound: user.notify_sound ?? true,
                notify_email: user.notify_email ?? false,
            });
        }
    }, [user]);

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/auth/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return res.data;
        },
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            addToast({
                type: 'success',
                title: t('settings.profileUpdated'),
                message: t('settings.photoUpdated'),
                duration: 4000
            });
        },
        onError: (error: unknown) => {
            const err = error as AxiosError<{ detail: string }>;
            addToast({
                type: 'error',
                title: t('common.error'),
                message: err.response?.data?.detail || t('settings.errorPhoto'),
            });
        }
    });

    const updateProfileMutation = useMutation({
        mutationFn: async (data: Partial<typeof formData> & { timezone?: string; notify_browser?: boolean; notify_sound?: boolean; notify_email?: boolean; preferences?: Record<string, unknown> }) => {
            const res = await api.patch('/auth/me', data);
            return res.data;
        },
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            addToast({
                type: 'success',
                title: t('settings.settingsUpdated'),
                message: t('settings.changesSaved'),
            });
            setActiveSection(null);
        },
        onError: (error: unknown) => {
            const err = error as AxiosError<{ detail: string }>;
            addToast({
                type: 'error',
                title: t('common.error'),
                message: err.response?.data?.detail || t('settings.errorSettings'),
            });
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadMutation.mutate(file);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleGeneralSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(generalFormData);
    };

    const handleNotificationsSave = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(notificationFormData);
    };

    const sections = [
        {
            id: 'general',
            title: t('settings.general'),
            icon: Eye,
            desc: t('settings.generalDesc'),
            onClick: () => setActiveSection('general')
        },
        {
            id: 'account',
            title: t('settings.account'),
            icon: User,
            desc: t('settings.accountDesc'),
            onClick: () => setActiveSection('account')
        },
        { id: 'notifications', title: t('settings.notifications'), icon: Bell, desc: t('settings.notificationsDesc'), onClick: () => setActiveSection('notifications') },
        { id: 'privacy', title: t('settings.privacy'), icon: Lock, desc: t('settings.privacyDesc'), onClick: () => setActiveSection('privacy') },
        { id: 'permissions', title: t('settings.permissions'), icon: Shield, desc: t('settings.permissionsDesc') },
        { id: 'permissions', title: t('settings.permissions'), icon: Shield, desc: t('settings.permissionsDesc') },
        ...(window.electron ? [{
            id: 'system',
            title: t('settings.system_integration'),
            icon: Server,
            desc: t('settings.system_integration_desc'),
            onClick: () => setActiveSection('system')
        }] : []),
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5] animate-in fade-in duration-300">
            {/* Header with Design System */}
            <div className="px-6 pt-4 pb-2 shrink-0 z-20 sticky top-0 pointer-events-none">
                <Header
                    title={t('settings.subtitle')}
                    subtitle={t('settings.title')}
                    icon={<SettingsIcon size={20} />}
                    iconColor="indigo"
                    sticky={false}
                    className="pointer-events-auto shadow-sm border border-[#E0E0E0] rounded-lg bg-white"
                />
            </div>


            <div className="p-8 max-w-4xl">
                <div className="flex items-center space-x-6 mb-8 p-6 bg-white rounded-lg border border-[#E0E0E0] shadow-sm">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <div
                        className="relative group cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Avatar
                            src={user?.avatar_url}
                            name={user?.full_name || user?.username || ''}
                            size="xl"
                            className="shadow-md"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-bold uppercase text-white tracking-widest">{t('settings.change')}</span>
                        </div>
                        {uploadMutation.isPending && (
                            <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-[#5B5FC7] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#242424]">{user?.full_name || user?.username}</h2>
                        <p className="text-[#616161]">{user?.email}</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-sm text-[#5B5FC7] font-semibold hover:underline active:scale-95 transition-transform"
                        >
                            {t('settings.changePhoto')}
                        </button>
                    </div>

                </div>

                <div className="space-y-3">
                    {sections.map((section) => (
                        <div
                            key={section.id}
                            onClick={section.onClick}
                            className="flex items-center p-4 rounded-lg bg-white border border-[#E0E0E0] hover:bg-[#F5F5F5] hover:border-[#BDBDBD] transition-all cursor-pointer group shadow-sm"
                        >
                            <div className="w-10 h-10 bg-[#F0F0F0] rounded-md flex items-center justify-center text-[#616161] group-hover:bg-white group-hover:text-[#5B5FC7] transition-colors">
                                <section.icon size={20} strokeWidth={1.5} />
                            </div>
                            <div className="ml-4 flex-1">
                                <h3 className="font-bold text-[#242424] text-sm">{section.title}</h3>
                                <p className="text-xs text-[#616161]">{section.desc}</p>
                            </div>
                            <div className="text-[#BDBDBD] group-hover:text-[#5B5FC7] transition-colors">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Account Settings Modal */}
            {activeSection === 'account' && (
                <Modal
                    isOpen={true}
                    onClose={() => setActiveSection(null)}
                    title={
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-[#EEF2FF] rounded-md text-[#5B5FC7]">
                                <User size={20} strokeWidth={1.5} />
                            </div>
                            <span>{t('settings.account')}</span>
                        </div>
                    }
                    size="md"
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setActiveSection(null)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleFormSubmit}
                                loading={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending ? t('settings.saving') : t('common.save')}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 border-b border-[#E0E0E0] pb-2">
                                <User size={16} className="text-[#888888]" />
                                <h3 className="font-bold text-[#242424] text-xs uppercase tracking-wide">{t('settings.personal_info')}</h3>
                            </div>

                            <Input
                                label={t('common.fullName')}
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                placeholder={t('settings.name_placeholder')}
                                fullWidth
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t('company.birth_date')}
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    leftIcon={<Calendar size={16} />}
                                    fullWidth
                                />
                                <Input
                                    label={t('common.phoneNumber')}
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    placeholder={t('common.phoneNumberPlaceholder')}
                                    fullWidth
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#616161] uppercase tracking-wide mb-1.5">Email</label>
                                <div className="px-3 py-2 bg-[#F5F5F5] border border-[#E0E0E0] rounded-md font-medium text-[#616161] flex items-center justify-between text-sm">
                                    <span>{user?.email}</span>
                                    <span className="text-[10px] font-bold uppercase text-[#5B5FC7] tracking-wider bg-[#EEF2FF] px-2 py-0.5 rounded border border-[#E0E7FF]">
                                        {t('settings.email_system')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Organizational Details */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 border-b border-[#E0E0E0] pb-2">
                                <Briefcase size={16} className="text-[#888888]" />
                                <h3 className="font-bold text-[#242424] text-xs uppercase tracking-wide">{t('settings.organization_info')}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t('common.rank')}
                                    value={formData.rank}
                                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                    placeholder={t('settings.rank_placeholder')}
                                    fullWidth
                                />
                                <Input
                                    label={t('common.cabinet')}
                                    value={formData.cabinet}
                                    onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                                    placeholder={t('common.cabinetPlaceholder')}
                                    fullWidth
                                />
                            </div>

                            <Input
                                label={t('company.position')}
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                placeholder={t('company.position')}
                                leftIcon={<Briefcase size={16} />}
                                fullWidth
                            />
                        </div>
                    </div>
                </Modal>
            )}
            {/* Notification Settings Modal */}
            {
                activeSection === 'notifications' && (
                    <Modal
                        isOpen={true}
                        onClose={() => setActiveSection(null)}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                    <Bell size={24} />
                                </div>
                                <span>{t('settings.notifications')}</span>
                            </div>
                        }
                        size="md"
                        footer={
                            <>
                                <Button
                                    variant="secondary"
                                    onClick={() => setActiveSection(null)}
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleNotificationsSave}
                                    loading={updateProfileMutation.isPending}
                                >
                                    {updateProfileMutation.isPending ? t('settings.saving') : t('common.save')}
                                </Button>
                            </>
                        }
                    >
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('settings.browser_notifications.title')}</h3>
                                    <p className="text-sm text-gray-500">{t('settings.browser_notifications.desc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={notificationFormData.notify_browser}
                                        onChange={(e) => setNotificationFormData({ ...notificationFormData, notify_browser: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('settings.sound_notifications.title')}</h3>
                                    <p className="text-sm text-gray-500">{t('settings.sound_notifications.desc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={notificationFormData.notify_sound}
                                        onChange={(e) => setNotificationFormData({ ...notificationFormData, notify_sound: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{t('settings.email_notifications.title')}</h3>
                                    <p className="text-sm text-gray-500">{t('settings.email_notifications.desc')}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={notificationFormData.notify_email}
                                        onChange={(e) => setNotificationFormData({ ...notificationFormData, notify_email: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>
                    </Modal>
                )
            }

            {/* Privacy & Security Modal */}
            {
                activeSection === 'privacy' && (
                    <Modal
                        isOpen={true}
                        onClose={() => setActiveSection(null)}
                        title={
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                                    <Shield size={24} />
                                </div>
                                <span>{t('settings.privacy')}</span>
                            </div>
                        }
                        size="md"
                    >
                        <div className="space-y-6">
                            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex items-start gap-3">
                                <Lock className="text-orange-600 shrink-0 mt-0.5" size={20} />
                                <div>
                                    <h3 className="font-bold text-orange-900 text-sm">{t('settings.security_title')}</h3>
                                    <p className="text-xs text-orange-700/80 mt-1 leading-relaxed">
                                        {t('settings.security_desc')}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setActiveSection('change-password')}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-indigo-200 hover:shadow-md rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-500 group-hover:text-indigo-600 transition-colors shadow-sm">
                                        <Lock size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">{t('settings.change_password')}</h3>
                                        <p className="text-xs text-gray-500">{t('settings.update_password_desc')}</p>
                                    </div>
                                </div>
                                <div className="text-gray-300 group-hover:text-indigo-400 transition-colors">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                        </div>
                    </Modal>
                )
            }

            {/* System Settings Modal */}


            {/* General Settings Modal */}
            {activeSection === 'general' && (
                <Modal
                    isOpen={true}
                    onClose={() => setActiveSection(null)}
                    title={
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                <Eye size={24} />
                            </div>
                            <span>{t('settings.general')}</span>
                        </div>
                    }
                    size="md"
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setActiveSection(null)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleGeneralSave}
                                loading={updateProfileMutation.isPending}
                            >
                                {updateProfileMutation.isPending ? t('settings.saving') : t('common.save')}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-6">
                        {/* Timezone */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">{t('settings.timezone')}</h3>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    value={generalFormData.timezone}
                                    onChange={(e) => setGeneralFormData({ ...generalFormData, timezone: e.target.value })}
                                    disabled={timezonesLoading}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    {timezonesLoading ? (
                                        <option value="">{t('common.loading')}</option>
                                    ) : (
                                        availableTimezones.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))
                                    )}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5 px-1">{t('settings.timezone_desc')}</p>
                        </div>

                        {/* Start Page */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">{t('settings.start_page')}</h3>
                            <select
                                value={generalFormData.preferences.start_page}
                                onChange={(e) => setGeneralFormData({
                                    ...generalFormData,
                                    preferences: { ...generalFormData.preferences, start_page: e.target.value }
                                })}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                            >
                                <option value="chat">{t('settings.start_page_chat')}</option>
                                <option value="company">{t('settings.start_page_company')}</option>
                                <option value="board">{t('settings.start_page_board')}</option>
                                <option value="tasks">{t('settings.start_page_tasks')}</option>
                                <option value="archive">{t('settings.start_page_archive')}</option>
                                <option value="email">{t('settings.start_page_email')}</option>
                            </select>
                        </div>

                        {/* Chat Settings */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">{t('settings.chat_settings')}</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-700">{t('settings.enter_to_send')}</p>
                                        <p className="text-xs text-gray-500">{t('settings.enter_to_send_desc')}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={generalFormData.preferences.enter_to_send}
                                            onChange={(e) => setGeneralFormData({
                                                ...generalFormData,
                                                preferences: { ...generalFormData.preferences, enter_to_send: e.target.checked }
                                            })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="font-medium text-gray-700">{t('settings.font_size')}</p>
                                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                            {typeof generalFormData.preferences.font_size === 'number'
                                                ? `${generalFormData.preferences.font_size}px`
                                                : generalFormData.preferences.font_size === 'large' ? '18px'
                                                    : generalFormData.preferences.font_size === 'small' ? '12px'
                                                        : '14px'}
                                        </span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">A</span>
                                            <input
                                                type="range"
                                                min="10"
                                                max="24"
                                                step="1"
                                                value={typeof generalFormData.preferences.font_size === 'number'
                                                    ? generalFormData.preferences.font_size
                                                    : generalFormData.preferences.font_size === 'large' ? 18
                                                        : generalFormData.preferences.font_size === 'small' ? 12 : 14}
                                                onChange={(e) => setGeneralFormData({
                                                    ...generalFormData,
                                                    preferences: { ...generalFormData.preferences, font_size: parseInt(e.target.value) }
                                                })}
                                                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
                                            />
                                            <span className="text-lg text-gray-400 font-bold uppercase tracking-wider">A</span>
                                        </div>

                                        {/* Preview Box */}
                                        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="h-2 w-20 bg-gray-100 rounded mb-2" />
                                                    <p
                                                        className="text-slate-900 leading-relaxed break-words"
                                                        style={{
                                                            fontSize: typeof generalFormData.preferences.font_size === 'number'
                                                                ? `${generalFormData.preferences.font_size}px`
                                                                : generalFormData.preferences.font_size === 'large' ? '18px'
                                                                    : generalFormData.preferences.font_size === 'small' ? '12px'
                                                                        : '14px'
                                                        }}
                                                    >
                                                        {t('settings.preview_text')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tasks Settings */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">{t('settings.tasks_settings')}</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-700">{t('settings.tasks_view')}</p>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setGeneralFormData({
                                            ...generalFormData,
                                            preferences: { ...generalFormData.preferences, tasks_view: 'list' }
                                        })}
                                        className={`px-3 py-1 text-sm rounded-md transition-all ${(generalFormData.preferences.tasks_view || 'list') === 'list'
                                            ? 'bg-white shadow text-gray-900 font-medium'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {t('settings.tasks_view_list')}
                                    </button>
                                    <button
                                        onClick={() => setGeneralFormData({
                                            ...generalFormData,
                                            preferences: { ...generalFormData.preferences, tasks_view: 'board' }
                                        })}
                                        className={`px-3 py-1 text-sm rounded-md transition-all ${(generalFormData.preferences.tasks_view) === 'board'
                                            ? 'bg-white shadow text-gray-900 font-medium'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {t('settings.tasks_view_board')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Change Password Modal */}
            {
                activeSection === 'change-password' && (
                    <ChangePasswordModal onClose={() => setActiveSection('privacy')} />
                )
            }
        </div >
    );
};

const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [passwordData, setPasswordData] = React.useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const changePasswordMutation = useMutation({
        mutationFn: async (data: typeof passwordData) => {
            const res = await api.post('/auth/change-password', {
                current_password: data.current_password,
                new_password: data.new_password
            });
            return res.data;
        },
        onSuccess: () => {
            addToast({
                type: 'success',
                title: t('common.success'),
                message: t('password.success'),
                duration: 4000
            });
            onClose();
        },
        onError: (error: unknown) => {
            const err = error as AxiosError<{ detail: string }>;
            addToast({
                type: 'error',
                title: t('common.error'),
                message: err.response?.data?.detail || t('password.error'),
                duration: 4000
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            addToast({
                type: 'error',
                title: t('common.error'),
                message: t('password.mismatch'),
                duration: 4000
            });
            return;
        }
        if (passwordData.new_password.length < 6) {
            addToast({
                type: 'error',
                title: t('common.error'),
                message: t('password.tooShort'),
                duration: 4000
            });
            return;
        }
        changePasswordMutation.mutate(passwordData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                        <Lock size={24} />
                    </div>
                    <span>{t('password.title')}</span>
                </div>
            }
            size="md"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        fullWidth
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        loading={changePasswordMutation.isPending}
                        fullWidth
                    >
                        {changePasswordMutation.isPending ? t('settings.saving') : t('settings.change')}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="password"
                    label={t('password.current')}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder={t('settings.passwordPlaceholder')}
                    required
                    fullWidth
                />
                <Input
                    type="password"
                    label={t('password.new')}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder={t('settings.passwordPlaceholder')}
                    required
                    fullWidth
                />
                <Input
                    type="password"
                    label={t('password.confirm')}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder={t('settings.passwordPlaceholder')}
                    required
                    fullWidth
                />
            </form>
        </Modal>
    );
};


export default SettingsPage;
