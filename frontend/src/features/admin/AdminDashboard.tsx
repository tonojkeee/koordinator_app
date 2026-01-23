/**
 * Admin Settings Components
 * Database and App settings tabs - extracted from legacy AdminDashboard
 */

import React, { useState, useEffect, useCallback, useLayoutEffect, startTransition } from 'react';
import type { TFunction } from 'i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { Shield, Sliders, MessageSquare, Settings, Database, Save } from 'lucide-react';
import { useToast } from '../../design-system';
import type { SystemSetting } from '../../types';
import type { DatabaseConfig } from './types';

/**
 * Database Settings Tab
 * Allows configuration of database connection settings
 */
export const DatabaseSettingsTab = ({ t }: { t: TFunction }) => {
    const { addToast } = useToast();
    const [config, setConfig] = useState<DatabaseConfig>({
        type: 'sqlite',
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: '',
        database: 'teamchat'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const loadConfig = useCallback(async () => {
        try {
            const { data } = await api.get('/admin/database/config');
            setConfig({
                ...data,
                port: data.port || 3306,
                type: data.type || 'sqlite'
            });
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: t('common.error'), message: t('admin.database.loadFailed') });
        } finally {
            setIsLoading(false);
        }
    }, [t, addToast]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const handleTest = async () => {
        setIsTesting(true);
        try {
            await api.post('/admin/database/test', config);
            addToast({ type: 'success', title: t('common.success'), message: t('admin.database.connectionSuccess') });
        } catch (error: unknown) {
            const message = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? t('admin.database.connectionFailed')
                : t('admin.database.connectionFailed');
            addToast({ type: 'error', title: t('common.error'), message });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        if (!confirm(t('admin.database.restartConfirm'))) return;

        setIsSaving(true);
        try {
            await api.post('/admin/database/save', config);
            addToast({ type: 'success', title: t('common.saved'), message: t('admin.database.restartNote') });
        } catch (error: unknown) {
            const message = error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? t('admin.database.saveFailed')
                : t('admin.database.saveFailed');
            addToast({ type: 'error', title: t('common.error'), message });
        } finally {
            setIsSaving(false);
        }
    };

    const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none";
    const labelClasses = "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 ml-1";

    if (isLoading) return (
        <div className="p-10 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.02)] max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                    <Database size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">{t('admin.database.title')}</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1">{t('admin.database.desc')}</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className={labelClasses}>{t('admin.database.engine')}</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setConfig({ ...config, type: 'sqlite' })}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${config.type === 'sqlite'
                                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                }`}
                        >
                            <span className="font-black text-lg">SQLite</span>
                            <span className="text-[10px] uppercase font-bold opacity-60">{t('admin.database.embedded')}</span>
                        </button>
                        <button
                            onClick={() => setConfig({ ...config, type: 'mysql' })}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${config.type === 'mysql'
                                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                    : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                }`}
                        >
                            <span className="font-black text-lg">MySQL</span>
                            <span className="text-[10px] uppercase font-bold opacity-60">{t('admin.database.external')}</span>
                        </button>
                    </div>
                </div>

                {config.type === 'mysql' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className={labelClasses}>{t('admin.database.host')}</label>
                                <input
                                    className={inputClasses}
                                    value={config.host || ''}
                                    onChange={e => setConfig({ ...config, host: e.target.value })}
                                    placeholder="localhost"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('admin.database.port')}</label>
                                <input
                                    type="number"
                                    className={inputClasses}
                                    value={config.port || ''}
                                    onChange={e => setConfig({ ...config, port: parseInt(e.target.value) || 3306 })}
                                    placeholder="3306"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClasses}>{t('admin.database.username')}</label>
                                <input
                                    className={inputClasses}
                                    value={config.user || ''}
                                    onChange={e => setConfig({ ...config, user: e.target.value })}
                                    placeholder="root"
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>{t('admin.database.password')}</label>
                                <input
                                    type="password"
                                    className={inputClasses}
                                    value={config.password || ''}
                                    onChange={e => setConfig({ ...config, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClasses}>{t('admin.database.dbName')}</label>
                            <input
                                className={inputClasses}
                                value={config.database || ''}
                                onChange={e => setConfig({ ...config, database: e.target.value })}
                                placeholder="teamchat_db"
                            />
                        </div>
                    </div>
                )}

                {config.type === 'sqlite' && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 font-medium">
                        {t('admin.database.sqliteDesc')}
                    </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button
                        onClick={handleTest}
                        disabled={isTesting || config.type === 'sqlite'}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isTesting ? t('admin.database.testing') : t('admin.database.testConnection')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {isSaving ? t('admin.database.saving') : t('admin.database.saveRestart')}
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Setting Field Component
 * Individual setting input with auto-save
 */
const SettingField = ({ setting, onUpdate, t }: { setting: SystemSetting, onUpdate: (val: string | number | boolean) => void, t: TFunction }) => {
    const parseVal = (s: SystemSetting) => {
        if (s.type === 'bool') return (s.value as string).toLowerCase() === 'true';
        if (s.type === 'int') return parseInt(s.value as string) || 0;
        return s.value;
    };

    const [val, setVal] = useState(parseVal(setting));
    const [isDirty, setIsDirty] = useState(false);

    useLayoutEffect(() => {
        startTransition(() => {
            setVal(parseVal(setting));
            setIsDirty(false);
        });
    }, [setting]);

    const handleChange = (newVal: string | number | boolean) => {
        setVal(newVal);
        setIsDirty(true);
        if (setting.type === 'bool') {
            onUpdate(newVal);
            setIsDirty(false);
        }
    };

    const handleBlur = () => {
        if (isDirty && setting.type !== 'bool') {
            onUpdate(val);
            setIsDirty(false);
        }
    };

    return (
        <div className="group">
            <div className="flex justify-between items-center mb-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">
                    {setting.description || setting.key}
                </label>
                {setting.is_public && (
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50 uppercase tracking-wider">Public</span>
                )}
            </div>

            {setting.type === 'bool' ? (
                <button
                    onClick={() => handleChange(!val)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${val
                            ? 'bg-indigo-50/50 border-indigo-200 text-indigo-700 shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    <span className="text-sm font-bold">{val ? t('common.enabled') : t('common.disabled')}</span>
                    <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${val ? 'bg-indigo-500' : 'bg-slate-300'} flex items-center`}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${val ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                </button>
            ) : (
                <div className="relative">
                    <input
                        type={setting.type === 'int' ? 'number' : 'text'}
                        value={val as string}
                        onChange={(e) => handleChange(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                        className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 font-bold text-slate-700 placeholder:text-slate-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none ${isDirty ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200'
                            }`}
                    />
                    {isDirty && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse">
                            <Save size={16} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * App Settings Tab
 * General application settings grouped by category
 */
export const AppSettingsTab = ({ t, visibleGroup }: { t: TFunction, visibleGroup?: string }) => {
    const { addToast } = useToast();
    const queryClient = useQueryClient();

    const { data: settings, isLoading } = useQuery<SystemSetting[]>({
        queryKey: ['system-settings'],
        queryFn: async () => (await api.get('/admin/settings')).data
    });

    const updateMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string, value: string | number | boolean }) => {
            return api.patch(`/admin/settings/${key}`, { value });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['system-settings'] });
            addToast({ type: 'success', title: t('admin.toast_saved'), message: t('admin.toast_setting_updated') });
        }
    });

    const groups = React.useMemo(() => {
        if (!settings) return {};
        const order = ['general', 'security', 'chat', 'email'];
        const grouped = settings.reduce((acc, setting) => {
            if (!acc[setting.group]) acc[setting.group] = [];
            acc[setting.group].push(setting);
            return acc;
        }, {} as Record<string, SystemSetting[]>);

        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const ia = order.indexOf(a);
            const ib = order.indexOf(b);
            if (ia === -1 && ib === -1) return a.localeCompare(b);
            if (ia === -1) return 1;
            if (ib === -1) return -1;
            return ia - ib;
        });

        const sortedGroups: Record<string, SystemSetting[]> = {};
        sortedKeys.forEach(k => {
            if (!visibleGroup || k === visibleGroup) {
                sortedGroups[k] = grouped[k];
            }
        });
        return sortedGroups;
    }, [settings, visibleGroup]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-500 animate-spin" />
            <span className="mt-4 text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">{t('common.loading')}</span>
        </div>
    );

    return (
        <div className="space-y-8 animate-in transition-all-custom">
            {Object.entries(groups).map(([group, groupSettings]) => (
                <div key={group} className="bg-white/70 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`p-3 rounded-2xl ${group === 'general' ? 'bg-indigo-50 text-indigo-600' :
                                group === 'security' ? 'bg-rose-50 text-rose-600' :
                                    group === 'chat' ? 'bg-teal-50 text-teal-600' :
                                        group === 'email' ? 'bg-violet-50 text-violet-600' :
                                            'bg-slate-100 text-slate-600'
                            }`}>
                            {group === 'general' ? <Sliders size={20} /> :
                                group === 'security' ? <Shield size={20} /> :
                                    group === 'chat' ? <MessageSquare size={20} /> :
                                        <Settings size={20} />}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight capitalize">
                            {t(`settings.groups.${group}`, group)}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
                        {groupSettings.map(setting => (
                            <SettingField
                                key={setting.key}
                                setting={setting}
                                onUpdate={(val) => updateMutation.mutate({ key: setting.key, value: val })}
                                t={t}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Legacy default export - kept for backward compatibility
const AdminDashboard: React.FC = () => {
    // This component is no longer used directly - AdminPage.tsx is the main entry point
    // Kept for backward compatibility only
    return null;
};

export default AdminDashboard;
