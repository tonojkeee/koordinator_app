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

    const inputClasses = "w-full bg-surface border border-border px-4 py-3 text-sm font-semibold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none";
    const labelClasses = "block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-2 ml-1";

    if (isLoading) return (
        <div className="p-10 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" />
        </div>
    );

    return (
        <div
            className="bg-white/70 backdrop-blur-md p-8 border border-white max-w-2xl mx-auto"
            style={{
                borderRadius: 'calc(var(--radius) * 2)',
                boxShadow: 'var(--shadow-subtle)'
            }}
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
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
                            className={`p-4 border-2 flex flex-col items-center gap-2 ${config.type === 'sqlite'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border/50 bg-surface text-muted-foreground hover:border-border'
                                }`}
                            style={{
                                borderRadius: 'var(--radius)',
                                transitionDuration: 'var(--duration-fast)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
                        >
                            <span className="font-black text-lg">SQLite</span>
                            <span className="text-[10px] uppercase font-bold opacity-60">{t('admin.database.embedded')}</span>
                        </button>
                        <button
                            onClick={() => setConfig({ ...config, type: 'mysql' })}
                            className={`p-4 border-2 flex flex-col items-center gap-2 ${config.type === 'mysql'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border/50 bg-surface text-muted-foreground hover:border-border'
                                }`}
                            style={{
                                borderRadius: 'var(--radius)',
                                transitionDuration: 'var(--duration-fast)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
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
                    <div
                        className="p-4 bg-surface border border-border text-xs text-muted-foreground font-medium"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        {t('admin.database.sqliteDesc')}
                    </div>
                )}

                <div className="pt-6 border-t border-border flex gap-4">
                    <button
                        onClick={handleTest}
                        disabled={isTesting || config.type === 'sqlite'}
                        className="flex-1 py-3 bg-surface border border-border text-foreground font-bold text-xs uppercase tracking-wider hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{
                            borderRadius: 'var(--radius)',
                            transitionDuration: 'var(--duration-fast)',
                            transitionTimingFunction: 'var(--easing-out)'
                        }}
                    >
                        {isTesting ? t('admin.database.testing') : t('admin.database.testConnection')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 bg-primary text-white font-bold text-xs uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{
                            borderRadius: 'var(--radius)',
                            boxShadow: 'var(--shadow-medium)',
                            transitionDuration: 'var(--duration-normal)',
                            transitionTimingFunction: 'var(--easing-out)'
                        }}
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
                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] ml-1">
                        {setting.description || setting.key}
                    </label>
                    {setting.is_public && (
                        <span
                            className="text-[9px] font-bold text-green-700 bg-green-500/10 px-2 py-0.5 border uppercase tracking-wider"
                            style={{
                                borderColor: 'var(--green-500/20)',
                                borderRadius: 'var(--radius)'
                            }}
                        >
                            {t('common.public')}
                        </span>
                    )}
                </div>

            {setting.type === 'bool' ? (
                <button
                    onClick={() => handleChange(!val)}
                    className={`w-full flex items-center justify-between p-4 border transition-all ${val
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface border-border text-muted-foreground hover:bg-surface-2'
                        }`}
                    style={{
                        borderRadius: 'var(--radius)',
                        transitionDuration: 'var(--duration-fast)',
                        transitionTimingFunction: 'var(--easing-out)'
                    }}
                >
                    <span className="text-sm font-bold">{val ? t('common.enabled') : t('common.disabled')}</span>
                    <div
                        className={`w-12 h-6 p-1 flex items-center transition-all`}
                        style={{
                            borderRadius: '9999px',
                            backgroundColor: val ? 'var(--primary)' : 'var(--muted-foreground)',
                            transitionDuration: 'var(--duration-fast)',
                            transitionTimingFunction: 'var(--easing-out)'
                        }}
                    >
                        <div
                            className={`w-4 h-4 bg-white transition-all`}
                            style={{
                                borderRadius: '50%',
                                transform: val ? 'translateX(24px)' : 'translateX(0)',
                                transitionDuration: 'var(--duration-fast)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
                        />
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
                        className={`w-full bg-surface border px-5 py-4 font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-surface transition-all outline-none ${isDirty ? 'border-warning bg-warning/10' : 'border-border'
                            }`}
                        style={{
                            borderRadius: 'var(--radius)',
                            transitionDuration: 'var(--duration-fast)',
                            transitionTimingFunction: 'var(--easing-out)'
                        }}
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
            <div
                className="w-16 h-16 rounded-full border-4 animate-spin"
                style={{
                    borderColor: 'var(--border)',
                    borderTopColor: 'var(--primary)'
                }}
            />
            <span className="mt-4 text-muted-foreground font-black text-xs uppercase tracking-widest animate-pulse">{t('common.loading')}</span>
        </div>
    );

    return (
        <div className="space-y-8 animate-in transition-all-custom">
            {Object.entries(groups).map(([group, groupSettings]) => (
                <div
                    key={group}
                    className="bg-white/70 backdrop-blur-md p-8 border border-white"
                    style={{
                        borderRadius: 'calc(var(--radius) * 2)',
                        boxShadow: 'var(--shadow-subtle)'
                    }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className={`p-3 rounded-lg ${group === 'general' ? 'bg-indigo-50 text-indigo-600' :
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
