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

import { useToast } from '../../design-system';
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
        { id: 'overview', icon: <Activity size={14} />, label: t('admin.overview') },
        { id: 'units', icon: <Building2 size={14} />, label: t('admin.units') },
        { id: 'users', icon: <Users size={14} />, label: t('admin.users') },
        { id: 'tasks', icon: <ClipboardList size={14} />, label: t('admin.tasks') },
        { id: 'sessions', icon: <BarChart2 size={14} />, label: t('admin.sessions') },
    ];

    const settingsTabs = [
        { id: 'settings_general', label: t('settings.groups.general'), icon: <Sliders size={12} /> },
        { id: 'settings_security', label: t('settings.groups.security'), icon: <Shield size={12} /> },
        { id: 'settings_chat', label: t('settings.groups.chat'), icon: <MessageSquare size={12} /> },
        { id: 'settings_email', label: t('settings.groups.email'), icon: <Settings size={12} /> },
        { id: 'settings_database', label: t('settings.groups.database'), icon: <Database size={12} /> },
    ];

    return (
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-screen">
            {/* Header */}
            <div className="px-6 pt-4 pb-2 shrink-0 z-30 sticky top-0 pointer-events-none">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 pointer-events-auto">
                    {/* Title Row */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 leading-tight">
                                {t('admin.dashboard')}
                            </h1>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {t('admin.systemControl')}
                            </p>
                        </div>
                    </div>

                    {/* Tabs Row */}
                    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
                        {mainTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}

                        {/* Settings Dropdown */}
                        <div className="relative group">
                            <button
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab.startsWith('settings')
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                <Sliders size={14} />
                                <span>{t('admin.settings')}</span>
                            </button>

                            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                {settingsTabs.map(sub => (
                                    <button
                                        key={sub.id}
                                        onClick={() => setActiveTab(sub.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === sub.id
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        {sub.icon}
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto pb-20">
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
                        <React.Suspense fallback={<div className="text-center py-10">Loading...</div>}>
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
            </main>

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
