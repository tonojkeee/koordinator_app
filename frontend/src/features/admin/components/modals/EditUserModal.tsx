/**
 * EditUserModal Component
 * Modal for editing user details with a clean, professional design
 */

import React, { useState } from 'react';
import { User as UserIcon, Building2, Key, Phone, Calendar, Hash, BadgeCheck, UserCircle2 } from 'lucide-react';

import { Modal, Button, Input, Select, TabNavigation } from '../../../../design-system';
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
            title={t('admin.editUser', `Edit User: ${user.full_name || user.username}`)}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {t('common.save')}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <TabNavigation
                    tabs={tabs}
                    activeTab={activeSection}
                    onTabChange={setActiveSection}
                />

                <div className="min-h-[400px]">
                    {activeSection === 'personal' && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {t('admin.personalInfo')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <Input
                                        label={t('admin.rank')}
                                        placeholder={t('admin.rankPlaceholder')}
                                        leftIcon={<UserIcon size={16} />}
                                        value={formData.rank || ''}
                                        onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                                    />
                                </div>
                                <Input
                                    label={t('common.username')}
                                    leftIcon={<UserCircle2 size={16} />}
                                    value={formData.username || ''}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                                <Input
                                    label={t('common.fullName')}
                                    placeholder={t('settings.name_placeholder')}
                                    leftIcon={<UserIcon size={16} />}
                                    value={formData.full_name || ''}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <Input
                                        label={t('common.email')}
                                        value={formData.email}
                                        disabled
                                        helperText={t('admin.systemReserved')}
                                    />
                                </div>
                                <Input
                                    label={t('common.phoneNumber')}
                                    placeholder={t('common.phoneNumberPlaceholder') || "+7 (999) 000-00-00"}
                                    leftIcon={<Phone size={16} />}
                                    value={formData.phone_number || ''}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                                <Input
                                    label={t('common.birthDate')}
                                    type="date"
                                    leftIcon={<Calendar size={16} />}
                                    value={formData.birth_date ? new Date(formData.birth_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'org' && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {t('admin.organization')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label={t('common.unit')}
                                    leftIcon={<Building2 size={16} />}
                                    value={formData.unit_id?.toString() || ''}
                                    onChange={(e) => setFormData({ ...formData, unit_id: Number(e.target.value) || null })}
                                    options={[
                                        { value: '', label: t('admin.noUnit') },
                                        ...units.map((u) => ({ value: u.id.toString(), label: u.name }))
                                    ]}
                                />
                                <Select
                                    label={t('admin.role')}
                                    leftIcon={<BadgeCheck size={16} />}
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' | 'operator' })}
                                    options={[
                                        { value: 'user', label: t('admin.roleUser') },
                                        { value: 'operator', label: t('admin.roleOperator') },
                                        { value: 'admin', label: t('admin.roleAdmin') }
                                    ]}
                                />
                                <Input
                                    label={t('common.cabinet')}
                                    placeholder={t('common.cabinetPlaceholder') || "404"}
                                    leftIcon={<Hash size={16} />}
                                    value={formData.cabinet || ''}
                                    onChange={(e) => setFormData({ ...formData, cabinet: e.target.value })}
                                />
                                <Input
                                    label={t('common.position')}
                                    placeholder={t('common.position')}
                                    leftIcon={<Building2 size={16} />}
                                    value={formData.position || ''}
                                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                />
                                <div className="md:col-span-2">
                                    <Select
                                        label={t('admin.accountStatus')}
                                        value={formData.status || 'active'}
                                        onChange={(e) => {
                                            const newStatus = e.target.value;
                                            const isActive = !['blocked', 'terminated'].includes(newStatus);
                                            setFormData({ ...formData, status: newStatus, is_active: isActive });
                                        }}
                                        options={[
                                            { value: 'active', label: t('admin.statusActive') },
                                            { value: 'on_leave', label: t('admin.statusOnLeave') },
                                            { value: 'away', label: t('admin.statusAway') },
                                            { value: 'blocked', label: t('admin.statusBlocked') },
                                            { value: 'terminated', label: t('admin.statusTerminated') }
                                        ]}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-slate-900">
                                {t('admin.securityControl')}
                            </h3>

                            <div className="space-y-4">
                                {!showPassword ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-slate-600">
                                            {t('admin.securityWarning')}
                                        </p>
                                        <Button
                                            variant="danger"
                                            onClick={() => setShowPassword(true)}
                                        >
                                            {t('admin.initReset')}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-slate-700">
                                                {t('admin.newPassword')}
                                            </label>
                                            <Input
                                                type="text"
                                                placeholder={t('admin.passwordPlaceholder') || "••••••••"}
                                                autoFocus
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="danger"
                                                onClick={() => {
                                                    if (newPassword.length >= 6) {
                                                        onResetPassword(user.id, newPassword);
                                                        setShowPassword(false);
                                                        setNewPassword('');
                                                    }
                                                }}
                                            >
                                                {t('admin.confirmUpdate')}
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => setShowPassword(false)}
                                            >
                                                {t('common.cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <p className="text-sm text-amber-600">
                                    {t('admin.passwordResetNotice', 'Password reset will immediately log the user out of all active sessions on all devices.')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default EditUserModal;
