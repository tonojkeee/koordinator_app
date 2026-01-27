import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { User } from '../../types';
import { HelpCircle, MessageSquare, Shield, LifeBuoy, Mail, Loader2, Headset, FileText, CheckCircle, ClipboardList, Building2, Archive } from 'lucide-react';
import { Modal } from '../../design-system';
import packageJson from '../../../package.json';

const HelpPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null);

    // Fetch users to find admins
    const { data: users } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/auth/users');
            return res.data;
        },
    });

    const admins = React.useMemo(() => users?.filter(u => u.role === 'admin') || [], [users]);

    // Set default selected admin when list loads
    React.useEffect(() => {
        if (admins.length > 0 && !selectedAdminId) {
            setSelectedAdminId(admins[0].id);
        }
    }, [admins, selectedAdminId]);

    const startDMMutation = useMutation({
        mutationFn: async (userId: number) => {
            const res = await api.post(`/chat/direct/${userId}`);
            return res.data;
        },
        onSuccess: (channel) => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            navigate(`/chat/${channel.id}`);
        },
    });

    const categories = [
        {
            icon: <MessageSquare size={24} className="text-[#5B5FC7]" strokeWidth={1.5} />,
            title: t('help.categories.chat.title'),
            desc: t('help.categories.chat.desc'),
            gradient: 'from-indigo-50 to-white'
        },
        {
            icon: <ClipboardList size={24} className="text-[#5B5FC7]" strokeWidth={1.5} />,
            title: t('help.categories.tasks.title'),
            desc: t('help.categories.tasks.desc'),
            gradient: 'from-violet-50 to-white'
        },
        {
            icon: <Building2 className="text-[#5B5FC7]" size={24} strokeWidth={1.5} />,
            title: t('help.categories.teams.title'),
            desc: t('help.categories.teams.desc'),
            gradient: 'from-emerald-50 to-white'
        },
        {
            icon: <FileText size={24} className="text-[#5B5FC7]" strokeWidth={1.5} />,
            title: t('help.categories.board.title'),
            desc: t('help.categories.board.desc'),
            gradient: 'from-blue-50 to-white'
        },
        {
            icon: <Archive className="text-[#5B5FC7]" size={24} strokeWidth={1.5} />,
            title: t('help.categories.archive.title'),
            desc: t('help.categories.archive.desc'),
            gradient: 'from-teal-50 to-white'
        },
        {
            icon: <Shield size={24} className="text-[#5B5FC7]" strokeWidth={1.5} />,
            title: t('help.categories.security.title'),
            desc: t('help.categories.security.desc'),
            gradient: 'from-amber-50 to-white'
        }
    ];

    // Import Building2 manually if not available in common imports, but looking at code it might be missing

    return (
        <div className="flex-1 overflow-y-auto bg-[#F5F5F5] p-4 md:p-8 animate-in fade-in duration-500">
            <div className="max-w-5xl mx-auto space-y-12">
                {/* Header Section */}
                <header className="relative py-10 px-8 bg-white rounded-lg overflow-hidden shadow-sm border border-[#E0E0E0]">
                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                        <div className="space-y-4 text-center md:text-left max-w-2xl">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#EEF2FF] border border-[#E0E7FF] rounded-full">
                                <span className="w-1.5 h-1.5 bg-[#5B5FC7] rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B5FC7]">
                                    {t('help.support_center_badge')}
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight leading-tight text-[#242424]">
                                <Trans i18nKey="help.hero_heading">
                                    Как мы можем <span className="text-[#5B5FC7]">помочь?</span>
                                </Trans>
                            </h1>
                            <p className="text-[#616161] text-lg font-medium leading-relaxed">
                                {t('help.description')}
                            </p>
                        </div>
                        <div className="shrink-0">
                            <div className="w-24 h-24 bg-[#F5F5F5] rounded-full flex items-center justify-center relative group">
                                <HelpCircle size={40} className="text-[#5B5FC7] relative z-10" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Categories Section */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-bold text-[#242424] tracking-tight">
                            {t('help.popular_sections_title')}
                        </h2>
                        <div className="h-px flex-1 bg-[#E0E0E0] mx-6 hidden md:block" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.map((cat, idx) => (
                            <div
                                key={idx}
                                className="group relative p-6 bg-white rounded-lg border border-[#E0E0E0] hover:border-[#5B5FC7]/30 hover:shadow-md transition-all duration-300 animate-in fade-in cursor-default"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-[#F5F5F5] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#EEF2FF] transition-colors duration-300">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-[#242424] mb-2">
                                        {cat.title}
                                    </h3>
                                    <p className="text-[#616161] text-sm leading-relaxed">
                                        {cat.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* IT Support Hero */}
                <section className="relative p-8 bg-white rounded-lg border border-[#E0E0E0] shadow-sm overflow-hidden group">
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
                        <div className="lg:w-1/2 space-y-6">
                            <div className="w-16 h-16 bg-[#5B5FC7] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#5B5FC7]/20">
                                <Headset size={32} strokeWidth={1.5} />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-bold text-[#242424] tracking-tight">
                                    {t('chat.it_support_center')}
                                </h3>
                                <p className="text-[#616161] text-base font-medium leading-relaxed">
                                    {t('help.supportDesc')}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSupportOpen(true)}
                                className="px-6 py-3 bg-[#242424] text-white rounded-md font-bold hover:bg-[#5B5FC7] transition-all active:scale-95 flex items-center space-x-2"
                            >
                                <MessageSquare size={18} strokeWidth={1.5} />
                                <span>{t('help.button_contact_support')}</span>
                            </button>
                        </div>

                        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                            <div className="p-5 bg-[#EEF2FF] rounded-lg space-y-2 border border-[#E0E7FF]">
                                <LifeBuoy className="text-[#5B5FC7]" size={24} strokeWidth={1.5} />
                                <h4 className="font-bold text-[#242424] text-sm">{t('help.feature_247_title')}</h4>
                                <p className="text-xs text-[#616161]">{t('help.feature_247_desc')}</p>
                            </div>
                            <div className="p-5 bg-[#F0FDF4] rounded-lg space-y-2 border border-[#DCFCE7] translate-y-4">
                                <CheckCircle size={24} className="text-green-600" strokeWidth={1.5} />
                                <h4 className="font-bold text-[#242424] text-sm">{t('help.feature_protection_title')}</h4>
                                <p className="text-xs text-[#616161]">{t('help.feature_protection_desc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Version Footer */}
                <footer className="pt-4 pb-8 flex flex-col items-center space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="h-px w-12 bg-[#E0E0E0]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#888888] pl-1">
                            Coordinator
                        </span>
                        <div className="h-px w-12 bg-[#E0E0E0]" />
                    </div>

                    <div className="flex flex-col items-center space-y-1">
                        <p className="text-xs font-bold text-[#242424]">
                            {t('help.version_text', { version: packageJson.version })}
                        </p>
                        <p className="text-[10px] text-[#888888]">
                            {t('help.copyright_text')}
                        </p>
                    </div>
                </footer>
            </div>


            {/* Support Modal */}
            <Modal
                isOpen={isSupportOpen}
                onClose={() => setIsSupportOpen(false)}
                title={t('help.supportModal.title')}
            >
                <div className="space-y-6 py-2">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Chat with Admin */}
                        <div className="p-6 bg-[#F5F5F5] border border-[#E0E0E0] rounded-lg flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#5B5FC7] mb-1 border border-[#E0E0E0]">
                                <Headset size={24} strokeWidth={1.5} />
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-[#242424]">{t('help.supportModal.chatWithAdmin')}</h3>
                                <p className="text-xs text-[#616161]">{t('help.contact.select_admin')}</p>
                            </div>

                            <div className="w-full max-w-xs space-y-3">
                                {admins.length > 0 ? (
                                    <>
                                        <select
                                            value={selectedAdminId || ''}
                                            onChange={(e) => setSelectedAdminId(Number(e.target.value))}
                                            className="w-full px-3 py-2 bg-white border border-[#E0E0E0] rounded-md focus:ring-1 focus:ring-[#5B5FC7] focus:border-[#5B5FC7] transition-all outline-none text-[#242424] text-sm font-medium appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23616161' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
                                        >
                                            {admins.map(admin => (
                                                <option key={admin.id} value={admin.id}>
                                                    {admin.full_name || admin.username}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => selectedAdminId && startDMMutation.mutate(selectedAdminId)}
                                            disabled={!selectedAdminId || startDMMutation.isPending}
                                            className="w-full py-2.5 px-4 bg-[#5B5FC7] text-white font-bold rounded-md hover:bg-[#4f52b2] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                                        >
                                            {startDMMutation.isPending ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <MessageSquare size={16} strokeWidth={1.5} />
                                            )}
                                            <span>{t('common.write')}</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-[#888888] font-medium py-2 text-sm">
                                        {t('help.supportModal.adminUnavailable')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Email Support */}
                        <a
                            href={`mailto:${t('help.supportModal.emailAddress')}`}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-[#E0E0E0] rounded-lg hover:border-[#5B5FC7] hover:shadow-sm transition-all duration-200 group"
                        >
                            <div className="w-12 h-12 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#EEF2FF] transition-colors">
                                <Mail className="text-[#616161] group-hover:text-[#5B5FC7]" size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-[#242424]">
                                {t('help.supportModal.emailSupport')}
                            </span>
                            <span className="text-[11px] mt-1 text-[#5B5FC7] font-medium">{t('help.supportModal.emailAddress')}</span>
                        </a>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default HelpPage;
