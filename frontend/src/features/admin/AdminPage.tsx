/**
 * AdminPage (formerly AdminDashboard)
 * Main admin panel with restructured modular components
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import {
    Shield, Activity, Building2, Users, ClipboardList,
    BarChart2, Sliders, MessageSquare, Settings, Database
} from 'lucide-react';

import { useToast, Header } from '../../design-system';
import type { User, Unit } from '../../types';

// Hooks
import {
    useOverviewStats,
    useActivityData,
    useStorageData,
    useUnitStats,
    useRecentActivity,
    useSystemHealth,
    useAdminUsers,
    useAdminUnits,
    useActiveSessions,
    useTaskUnitStats,
    useAllTasks
} from './hooks/useAdminQueries';

// Tabs
import { OverviewTab, UsersTab, UnitsTab, TasksTab, SessionsTab, EmailSettingsTab } from './components/tabs';

// Modals
import { EditUserModal, EditUnitModal, LogsModal } from './components/modals';

// Lazy load settings tabs (less frequently used)
const DatabaseSettingsTab = React.lazy(() =>
    import('./AdminDashboard').then(m => ({ default: m.DatabaseSettingsTab }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as React.LazyExoticComponent<React.ComponentType<{ t: any }>>;

const AppSettingsTab = React.lazy(() =>
    import('./AdminDashboard').then(m => ({ default: m.AppSettingsTab }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as React.LazyExoticComponent<React.ComponentType<{ t: any; visibleGroup?: string }>>;

const AdminPage: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Local state
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editingUnit, setEditingUnit] = useState<Partial<Unit> | null>(null);
    const [isLogsOpen, setIsLogsOpen] = useState(false);

    // Data fetching
    const { data: stats } = useOverviewStats();
    const { data: activityData } = useActivityData();
    const { data: storageData } = useStorageData();
    const { data: unitStats } = useUnitStats();
    const { data: recentActivity } = useRecentActivity();
    const { data: systemHealth } = useSystemHealth();
    const { data: users } = useAdminUsers();
    const { data: units } = useAdminUnits();
    const { data: activeSessions, isLoading: isLoadingSessions } = useActiveSessions();
    const { data: taskUnitStats } = useTaskUnitStats(activeTab === 'tasks');
    const { data: allTasks, isLoading: isLoadingTasks } = useAllTasks(activeTab === 'tasks');

    // Mutations
    const createUnitMutation = useMutation({
        mutationFn: (data: Partial<Unit>) => api.post('/auth/units', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-units'] });
            addToast({ type: 'success', title: t('common.success'), message: t('admin.unitCreated') });
            setEditingUnit(null);
        }
    });

    const updateUnitMutation = useMutation({
        mutationFn: ({ unitId, data }: { unitId: number; data: Partial<Unit> }) =>
            api.patch(`/auth/units/${unitId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-units'] });
            addToast({ type: 'success', title: t('common.success'), message: t('admin.unitUpdated') });
            setEditingUnit(null);
        }
    });

    const deleteUnitMutation = useMutation({
        mutationFn: (unitId: number) => api.delete(`/auth/units/${unitId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-units'] });
            addToast({ type: 'success', title: t('common.success'), message: t('admin.unitDeleted') });
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => api.delete(`/auth/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            addToast({ type: 'success', title: t('common.deleted'), message: t('admin.userDeleted') });
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: number; data: Partial<User> }) =>
            api.patch(`/auth/users/${userId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['channel_members'] });
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            addToast({ type: 'success', title: t('common.saved'), message: t('admin.userUpdated') });
            setEditingUser(null);
        }
    });

    const resetPasswordMutation = useMutation({
        mutationFn: ({ userId, password }: { userId: number; password: string }) =>
            api.post(`/auth/users/${userId}/password`, { new_password: password }),
        onSuccess: () => {
            addToast({ type: 'success', title: t('common.success'), message: t('admin.passwordUpdated') });
        }
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (taskId: number) => api.delete(`/tasks/${taskId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-all-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            addToast({ type: 'success', title: t('common.deleted'), message: t('tasks.deleted') });
        }
    });

    // Filtered users
    const filteredUsers = users?.filter(u => {
        const matchesSearch =
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    }) || [];

    // Tab definitions
    const mainTabs = [
        { id: 'overview', icon: <Activity size={16} strokeWidth={1.5} />, label: t('admin.overview') },
        { id: 'units', icon: <Building2 size={16} strokeWidth={1.5} />, label: t('admin.units') },
        { id: 'users', icon: <Users size={16} strokeWidth={1.5} />, label: t('admin.users') },
        { id: 'tasks', icon: <ClipboardList size={16} strokeWidth={1.5} />, label: t('admin.tasks') },
        { id: 'sessions', icon: <BarChart2 size={16} strokeWidth={1.5} />, label: t('admin.sessions') },
    ];

    const settingsTabs = [
        { id: 'settings_general', label: t('settings.groups.general'), icon: <Sliders size={16} strokeWidth={1.5} /> },
        { id: 'settings_security', label: t('settings.groups.security'), icon: <Shield size={16} strokeWidth={1.5} /> },
        { id: 'settings_chat', label: t('settings.groups.chat'), icon: <MessageSquare size={16} strokeWidth={1.5} /> },
        { id: 'settings_email', label: t('settings.groups.email'), icon: <Settings size={16} strokeWidth={1.5} /> },
        { id: 'settings_database', label: t('settings.groups.database'), icon: <Database size={16} strokeWidth={1.5} /> },
    ];

    return (
        <div className="flex-1 flex flex-col bg-background overflow-hidden animate-fade-in">
            {/* Header */}
            <Header
                title={t('admin.dashboard')}
                subtitle={t('admin.systemControl')}
                icon={<Shield size={20} strokeWidth={2} />}
                iconColor="indigo"
                sticky={true}
                tabs={mainTabs.map(tab => ({
                    ...tab,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    icon: React.cloneElement(tab.icon as React.ReactElement<any>, { strokeWidth: 2 })
                }))}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                actions={
                    <div className="relative group">
                        <button
                            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${activeTab.startsWith('settings')
                                ? 'bg-primary text-white shadow-medium scale-105'
                                : 'text-muted-foreground hover:text-foreground hover:bg-surface-3 opacity-80 hover:opacity-100'
                                }`}
                            style={{
                                transitionDuration: 'var(--duration-normal)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
                        >
                            <Sliders size={16} strokeWidth={2.5} />
                            <span>{t('admin.settings')}</span>
                        </button>

                        <div
                            className="absolute top-full right-0 mt-3 w-56 bg-surface border border-border rounded-lg p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 z-50"
                            style={{
                                boxShadow: 'var(--shadow-strong)',
                                transitionDuration: 'var(--duration-normal)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
                        >
                            {settingsTabs.map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => setActiveTab(sub.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${activeTab === sub.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                                        }`}
                                    style={{
                                        transitionDuration: 'var(--duration-fast)',
                                        transitionTimingFunction: 'var(--easing-out)'
                                    }}
                                >
                                    <span className={activeTab === sub.id ? 'text-primary' : 'text-muted-foreground'}>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {React.cloneElement(sub.icon as React.ReactElement<any>, { size: 16, strokeWidth: 2.5 })}
                                    </span>
                                    {sub.label}
                                </button>
                            ))}
                        </div>
                    </div>
                }
            />

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: 'var(--spacing-xs) var(--spacing-lg) var(--spacing-lg)' }}>
                <div className="max-w-7xl mx-auto pb-20 animate-slide-up">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            t={t}
                            stats={stats}
                            activityData={activityData}
                            storageData={storageData}
                            unitStats={unitStats}
                            recentActivity={recentActivity}
                            systemHealth={systemHealth}
                            onViewLogs={() => setIsLogsOpen(true)}
                        />
                    )}

                    {activeTab === 'users' && (
                        <UsersTab
                            t={t}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            filteredUsers={filteredUsers}
                            setEditingUser={setEditingUser}
                            deleteUserMutation={deleteUserMutation}
                        />
                    )}

                    {activeTab === 'units' && (
                        <UnitsTab
                            t={t}
                            units={units}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setEditingUnit={setEditingUnit}
                            deleteUnitMutation={deleteUnitMutation}
                        />
                    )}

                    {activeTab === 'tasks' && (
                        <TasksTab
                            t={t}
                            stats={stats}
                            taskUnitStats={taskUnitStats}
                            allTasks={allTasks}
                            isLoading={isLoadingTasks}
                            onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
                        />
                    )}

                    {activeTab === 'sessions' && (
                        <SessionsTab
                            t={t}
                            sessions={activeSessions}
                            isLoading={isLoadingSessions}
                        />
                    )}

                    {/* Settings tabs - keep in old file for now */}
                    {activeTab.startsWith('settings') && (
                        <React.Suspense fallback={<div className="text-center py-10">{t('common.loading')}</div>}>
                            {activeTab === 'settings_database' ? (
                                <DatabaseSettingsTab t={t} />
                            ) : activeTab === 'settings_email' ? (
                                <EmailSettingsTab />
                            ) : (
                                <AppSettingsTab t={t} visibleGroup={activeTab.split('_')[1]} />
                            )}
                        </React.Suspense>
                    )}
                </div>
            </div>

            {/* Modals */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    units={units || []}
                    onClose={() => setEditingUser(null)}
                    onSave={(id, data) => updateUserMutation.mutate({ userId: id, data })}
                    onResetPassword={(id, pass) => resetPasswordMutation.mutate({ userId: id, password: pass })}
                    t={t}
                />
            )}

            {editingUnit && (
                <EditUnitModal
                    unit={editingUnit}
                    onClose={() => setEditingUnit(null)}
                    onSave={(data) => {
                        if (editingUnit.id) {
                            updateUnitMutation.mutate({ unitId: editingUnit.id, data });
                        } else {
                            createUnitMutation.mutate(data);
                        }
                    }}
                    t={t}
                />
            )}

            {isLogsOpen && (
                <LogsModal
                    onClose={() => setIsLogsOpen(false)}
                    t={t}
                />
            )}
        </div>
    );
};

export default AdminPage;
