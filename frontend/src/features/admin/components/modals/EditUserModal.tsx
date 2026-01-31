/**
 * EditUserModal Component
 * Modal for editing user details with a clean, professional design
 */

import React, { useState } from 'react';
import { User as UserIcon, Building2, Key, Phone, Calendar, Hash, BadgeCheck, UserCircle2, Lock, AlertCircle } from 'lucide-react';

import { Modal, Button, Input, TabNavigation } from '../../../../design-system';
import type { EditUserModalProps } from '../../types';

export const EditUserModal: React.FC<EditUserModalProps> = ({
    user,
    units,
    onClose,
    onSave,
    onResetPassword,
    t
}) => {
    const [formData, setFormData] = useState({ ...user });
    const [showPassword, setShowPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [activeSection, setActiveSection] = useState('personal');

    const tabs = [
        { id: 'personal', label: t('admin.personalInfo'), icon: <UserIcon size={14} /> },
        { id: 'org', label: t('admin.organization'), icon: <Building2 size={14} /> },
        { id: 'security', label: t('admin.security'), icon: <Key size={14} /> }
    ];

    const handleSave = () => {
        onSave(user.id, formData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            size="lg"
            title={
                <div className="flex flex-col">
                    <span className="text-xl font-black text-foreground uppercase tracking-tight">{t('admin.editUser')}</span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mt-1 opacity-70">
                        {user.full_name || user.username}
                    </span>
                </div>
            }
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} className="font-black uppercase tracking-widest text-xs px-6">
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        className="font-black uppercase tracking-widest text-xs px-8 scale-105"
                        style={{
                            boxShadow: 'var(--shadow-medium)'
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </>
            }
        >
            <div className="space-y-8 animate-fade-in">
                <TabNavigation
                    tabs={tabs.map(tab => ({
                        ...tab,
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        icon: React.cloneElement(tab.icon as React.ReactElement<any>, { size: 16, strokeWidth: 2.5 })
                    }))}
                    activeTab={activeSection}
                    onTabChange={setActiveSection}
                    className="bg-surface-2 border-border/50"
                />

                <div className="min-h-[450px] animate-slide-up">
                    {activeSection === 'personal' && (
                         <div className="space-y-7">
                            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                                <div
                                    className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary shadow-sm"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <UserIcon size={16} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] opacity-80">
                                    {t('admin.personalInfo')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <Input
                                        label={t('admin.rank')}
                                        placeholder={t('admin.rankPlaceholder')}
                                        leftIcon={<UserIcon size={16} strokeWidth={2} />}
                                        value={formData.rank || ''}
                                        onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                        className="bg-surface-2 focus:bg-surface border-border/60"
                                    />
                                </div>
                                <Input
                                    label={t('common.username')}
                                    leftIcon={<UserCircle2 size={16} strokeWidth={2} />}
                                    value={formData.username || ''}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="bg-surface-2 focus:bg-surface border-border/60 font-black tracking-tight"
                                />
                                <Input
                                    label={t('common.fullName')}
                                    placeholder={t('settings.name_placeholder')}
                                    leftIcon={<UserIcon size={16} strokeWidth={2} />}
                                    value={formData.full_name || ''}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="bg-surface-2 focus:bg-surface border-border/60 font-bold"
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label={t('common.email')}
                                        value={formData.email}
                                        disabled
                                        helperText={t('admin.systemReserved')}
                                        className="bg-surface-3 opacity-60 border-border/40 font-bold"
                                    />
                                </div>
                                <Input
                                    label={t('common.phoneNumber')}
                                    placeholder={t('common.phoneNumberPlaceholder') || "+7 (999) 000-00-00"}
                                    leftIcon={<Phone size={16} strokeWidth={2} />}
                                    value={formData.phone_number || ''}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="bg-surface-2 focus:bg-surface border-border/60 tabular-nums font-bold"
                                />
                                <Input
                                    label={t('common.birthDate')}
                                    type="date"
                                    leftIcon={<Calendar size={16} strokeWidth={2} />}
                                    value={formData.birth_date ? new Date(formData.birth_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className="bg-surface-2 focus:bg-surface border-border/60 font-bold"
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'org' && (
                         <div className="space-y-7">
                            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                                <div
                                    className="w-8 h-8 bg-primary/10 flex items-center justify-center text-primary shadow-sm"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <Building2 size={16} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] opacity-80">
                                    {t('admin.organization')}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70">{t('common.unit')}</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full h-11 px-4 pr-10 bg-surface-2 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                                            value={formData.unit_id?.toString() || ''}
                                            onChange={(e) => setFormData({ ...formData, unit_id: Number(e.target.value) || null })}
                                        >
                                            <option value="">{t('admin.noUnit')}</option>
                                            {units.map((u) => (
                                                <option key={u.id} value={u.id.toString()}>{u.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                            <Building2 size={16} strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70">{t('admin.role')}</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full h-11 px-4 pr-10 bg-surface-2 border border-border rounded-xl text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' | 'operator' })}
                                        >
                                            <option value="user">{t('admin.roleUser')}</option>
                                            <option value="operator">{t('admin.roleOperator')}</option>
                                            <option value="admin">{t('admin.roleAdmin')}</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                            <BadgeCheck size={16} strokeWidth={2} />
                                        </div>
                                    </div>
                                </div>

                                <Input
                                    label={t('common.cabinet')}
                                    placeholder={t('common.cabinetPlaceholder') || "404"}
                                    leftIcon={<Hash size={16} strokeWidth={2} />}
                                    value={formData.cabinet || ''}
                                    onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                                    className="bg-surface-2 focus:bg-surface border-border/60 tabular-nums font-black"
                                />
                                <Input
                                    label={t('common.position')}
                                    placeholder={t('common.position')}
                                    leftIcon={<Building2 size={16} strokeWidth={2} />}
                                    value={formData.position || ''}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                    className="bg-surface-2 focus:bg-surface border-border/60 font-bold"
                                />
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70">{t('admin.accountStatus')}</label>
                                    <select
                                        className="w-full h-11 px-4 bg-surface-2 border border-border rounded-xl text-xs font-black uppercase tracking-widest text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                                        value={formData.status || 'active'}
                                        onChange={(e) => {
                                            const newStatus = e.target.value;
                                            const isActive = !['blocked', 'terminated'].includes(newStatus);
                                            setFormData({ ...formData, status: newStatus, is_active: isActive });
                                        }}
                                    >
                                        <option value="active">{t('admin.statusActive')}</option>
                                        <option value="on_leave">{t('admin.statusOnLeave')}</option>
                                        <option value="away">{t('admin.statusAway')}</option>
                                        <option value="blocked">{t('admin.statusBlocked')}</option>
                                        <option value="terminated">{t('admin.statusTerminated')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                         <div className="space-y-7">
                            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                                <div
                                    className="w-8 h-8 bg-destructive/10 flex items-center justify-center text-destructive shadow-sm"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <Key size={16} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] opacity-80">
                                    {t('admin.securityControl')}
                                </h3>
                            </div>

                            <div className="space-y-6">
                                {!showPassword ? (
                                    <div className="space-y-5">
                                        <div
                                            className="p-5 bg-destructive/5 border border-destructive/10 animate-scale-in"
                                            style={{
                                                borderRadius: 'var(--radius)'
                                            }}
                                        >
                                            <p className="text-sm text-destructive font-black leading-relaxed tracking-tight">
                                                {t('admin.securityWarning')}
                                            </p>
                                        </div>
                                        <Button
                                            variant="danger"
                                            onClick={() => setShowPassword(true)}
                                            className="w-full font-black uppercase tracking-widest text-xs py-4"
                                            icon={<Lock size={18} strokeWidth={2.5} />}
                                            style={{
                                                borderRadius: 'var(--radius)',
                                                boxShadow: 'var(--shadow-medium)'
                                            }}
                                        >
                                            {t('admin.initReset')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6 animate-slide-up">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-destructive uppercase tracking-widest ml-1">
                                                {t('admin.newPassword')}
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder={t('admin.passwordPlaceholder') || "••••••••"}
                                                autoFocus
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="bg-surface border-destructive/30 focus:border-destructive text-lg font-black tracking-[0.3em] text-center shadow-inner py-4"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <Button
                                                variant="danger"
                                                className="flex-1 font-black uppercase tracking-widest text-xs py-4"
                                                onClick={() => {
                                                    if (newPassword.length >= 6) {
                                                        onResetPassword(user.id, newPassword);
                                                        setShowPassword(false);
                                                        setNewPassword('');
                                                    }
                                                }}
                                                style={{
                                                    borderRadius: 'var(--radius)',
                                                    boxShadow: 'var(--shadow-subtle)'
                                                }}
                                            >
                                                {t('admin.confirmUpdate')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="flex-1 font-black uppercase tracking-widest text-xs py-4"
                                                onClick={() => setShowPassword(false)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div
                                    className="p-4 bg-amber-500/5 border border-amber-500/10 flex items-start gap-3"
                                    style={{
                                        borderRadius: 'var(--radius)'
                                    }}
                                >
                                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" strokeWidth={3} />
                                    <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                                        {t('admin.passwordResetNotice', 'Password reset will immediately log user out of all active sessions on all devices.')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EditUserModal;
