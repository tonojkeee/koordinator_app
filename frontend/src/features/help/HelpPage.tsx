import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import type { User } from '../../types';
import { HelpCircle, MessageSquare, Shield, LifeBuoy, Mail, Loader2, Headset, FileText, CheckCircle, ClipboardList, Building2, Archive, ChevronRight } from 'lucide-react';
import { Modal, Header, Button } from '../../design-system';
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
            icon: <MessageSquare size={24} className="text-primary" strokeWidth={2} />,
            title: t('help.categories.chat.title'),
            desc: t('help.categories.chat.desc'),
        },
        {
            icon: <ClipboardList size={24} className="text-primary" strokeWidth={2} />,
            title: t('help.categories.tasks.title'),
            desc: t('help.categories.tasks.desc'),
        },
        {
            icon: <Building2 className="text-primary" size={24} strokeWidth={2} />,
            title: t('help.categories.teams.title'),
            desc: t('help.categories.teams.desc'),
        },
        {
            icon: <FileText size={24} className="text-primary" strokeWidth={2} />,
            title: t('help.categories.board.title'),
            desc: t('help.categories.board.desc'),
        },
        {
            icon: <Archive size={24} className="text-primary" strokeWidth={2} />,
            title: t('help.categories.archive.title'),
            desc: t('help.categories.archive.desc'),
        },
        {
            icon: <Shield size={24} className="text-primary" strokeWidth={2} />,
            title: t('help.categories.security.title'),
            desc: t('help.categories.security.desc'),
        }
    ];

    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden animate-fade-in">
            {/* Header with Design System */}
            <Header
                title={t('help.hero_heading')}
                subtitle={t('help.support_center_badge')}
                icon={<HelpCircle size={20} strokeWidth={2} />}
                iconColor="indigo"
                sticky={true}
            />

            <div className="flex-1 overflow-y-auto px-6 pb-12 pt-2 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-12 pb-12 animate-slide-up">
                    {/* Hero Section */}
                    <div className="relative py-12 px-10 bg-surface rounded-3xl overflow-hidden shadow-m3-1 border border-border group active:scale-[0.99] transition-all">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 pointer-events-none">
                            <HelpCircle size={300} strokeWidth={1} />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-10">
                            <div className="space-y-6 text-center md:text-left max-w-2xl">
                                <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-primary/5 border border-primary/10 rounded-full shadow-sm">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--teams-brand)]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                        {t('help.support_center_badge')}
                                    </span>
                                </div>
                                <h1 className="text-5xl font-black tracking-tighter leading-none text-foreground uppercase">
                                    <Trans i18nKey="help.hero_heading">
                                        Как мы можем <span className="text-primary">помочь?</span>
                                    </Trans>
                                </h1>
                                <p className="text-muted-foreground text-lg font-bold leading-relaxed opacity-80">
                                    {t('help.description')}
                                </p>
                            </div>
                            <div className="shrink-0">
                                <div className="w-32 h-32 bg-surface-2 rounded-3xl flex items-center justify-center relative group-hover:rotate-12 transition-all duration-500 shadow-inner">
                                    <HelpCircle size={64} className="text-primary relative z-10" strokeWidth={1.5} />
                                    <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Categories Section */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-black text-foreground tracking-tight uppercase tracking-widest opacity-80">
                                {t('help.popular_sections_title')}
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent mx-8 hidden md:block" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((cat, idx) => (
                                <div
                                    key={idx}
                                    className="group relative p-8 bg-surface rounded-lg border border-border hover:border-primary/20 hover:shadow-m3-2 transition-all duration-500 animate-slide-up cursor-pointer active:scale-95"
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                >
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-surface-2 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110 group-hover:rotate-3">
                                            {cat.icon}
                                        </div>
                                        <h3 className="text-lg font-black text-foreground mb-3 tracking-tight transition-colors group-hover:text-primary">
                                            {cat.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                                            {cat.desc}
                                        </p>
                                    </div>
                                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        <ChevronRight size={16} className="text-primary" strokeWidth={3} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* IT Support Hero */}
                    <section className="relative p-10 bg-surface rounded-3xl border border-border shadow-m3-1 overflow-hidden group">
                        {/* Mesh background effect */}
                        <div className="absolute inset-0 bg-primary/5 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                            <div className="lg:w-1/2 space-y-8">
                                <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center text-white shadow-m3-2 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                                    <Headset size={40} strokeWidth={2} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">
                                        {t('chat.it_support_center')}
                                    </h3>
                                    <p className="text-muted-foreground text-lg font-bold leading-relaxed opacity-70">
                                        {t('help.supportDesc')}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsSupportOpen(true)}
                                    variant="primary"
                                    size="lg"
                                    className="px-10 py-4 font-black uppercase tracking-widest text-xs shadow-m3-2 group-hover:scale-105 transition-all"
                                    icon={<MessageSquare size={20} strokeWidth={2.5} />}
                                >
                                    {t('help.button_contact_support')}
                                </Button>
                            </div>

                            <div className="lg:w-1/2 grid grid-cols-2 gap-6">
                                <div className="p-6 bg-surface rounded-lg shadow-m3-1 border border-border/50 group-hover:border-primary/10 transition-all hover:translate-y-[-4px]">
                                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary mb-4">
                                        <LifeBuoy size={24} strokeWidth={2.5} />
                                    </div>
                                    <h4 className="font-black text-foreground text-sm tracking-tight uppercase mb-2">{t('help.feature_247_title')}</h4>
                                    <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-60">{t('help.feature_247_desc')}</p>
                                </div>
                                <div className="p-6 bg-surface rounded-lg shadow-m3-1 border border-border/50 group-hover:border-green-500/10 transition-all translate-y-6 hover:translate-y-2">
                                    <div className="w-10 h-10 bg-green-500/5 rounded-xl flex items-center justify-center text-green-600 mb-4">
                                        <CheckCircle size={24} strokeWidth={2.5} />
                                    </div>
                                    <h4 className="font-black text-foreground text-sm tracking-tight uppercase mb-2">{t('help.feature_protection_title')}</h4>
                                    <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-60">{t('help.feature_protection_desc')}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Version Footer */}
                    <footer className="pt-8 pb-12 flex flex-col items-center space-y-6">
                        <div className="flex items-center space-x-8 opacity-30">
                            <div className="h-px w-20 bg-gradient-to-l from-border to-transparent" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground">
                                Coordinator
                            </span>
                            <div className="h-px w-20 bg-gradient-to-r from-border to-transparent" />
                        </div>

                        <div className="flex flex-col items-center space-y-2">
                            <p className="text-xs font-black text-foreground tracking-widest bg-surface-2 px-3 py-1 rounded-full border border-border shadow-sm uppercase opacity-80">
                                {t('help.version_text', { version: packageJson.version })}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">
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
        </div>
    );
};

export default HelpPage;
