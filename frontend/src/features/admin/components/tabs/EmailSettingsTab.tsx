import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Server, RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../../api/client';
import { useToast } from '../../../../design-system';

interface EmailSettings {
  internal_email_domain: string;
  smtp_host: string;
  smtp_port: number;
  total_accounts: number;
  total_messages: number;
}

interface EmailSettingsUpdate {
  internal_email_domain: string;
}

interface RecreateResponse {
  updated_accounts: number;
  message: string;
}

export const EmailSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState('');

  const { data: emailSettings, isLoading } = useQuery<EmailSettings>({
    queryKey: ['admin', 'email-settings'],
    queryFn: async () => (await api.get('/admin/email/settings')).data
  });

  const updateDomainMutation = useMutation({
    mutationFn: async (data: EmailSettingsUpdate) => {
      return api.patch('/admin/email/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-settings'] });
      addToast({
        type: 'success',
        title: t('common.success'),
        message: t('admin.email.domainUpdated')
      });
      setNewDomain('');
    },
    onError: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any)?.response?.data?.detail || t('admin.email.updateFailed');
      addToast({ type: 'error', title: t('common.error'), message });
    }
  });

  const recreateAccountsMutation = useMutation({
    mutationFn: async () => {
      return api.post('/admin/email/recreate-accounts');
    },
    onSuccess: (response) => {
      const data: RecreateResponse = response.data;
      queryClient.invalidateQueries({ queryKey: ['admin', 'email-settings'] });
      addToast({
        type: 'success',
        title: t('common.success'),
        message: data.message
      });
    },
    onError: (error: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (error as any)?.response?.data?.detail || t('admin.email.recreateFailed');
      addToast({ type: 'error', title: t('common.error'), message });
    }
  });

  const handleUpdateDomain = () => {
    if (!newDomain.trim()) {
      addToast({ 
        type: 'error', 
        title: t('common.error'), 
        message: t('admin.email.domainRequired') 
      });
      return;
    }

    updateDomainMutation.mutate({ internal_email_domain: newDomain.trim() });
  };

  const handleRecreateAccounts = () => {
    if (!confirm(t('admin.email.recreateConfirm'))) return;
    recreateAccountsMutation.mutate();
  };

  React.useEffect(() => {
    if (emailSettings) {
      setNewDomain(emailSettings.internal_email_domain);
    }
  }, [emailSettings]);

  const inputClasses = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all outline-none";
  const labelClasses = "block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 ml-1";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-violet-500 animate-spin" />
        <span className="mt-4 text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">
          {t('common.loading')}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Settings Overview */}
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-600">
            <Mail size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">
              {t('admin.email.title')}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {t('admin.email.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-2xl border border-violet-100">
            <div className="flex items-center gap-3 mb-2">
              <Server size={16} className="text-violet-600" />
              <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                {t('admin.email.currentDomain')}
              </span>
            </div>
            <p className="text-lg font-black text-slate-900 truncate">
              {emailSettings?.internal_email_domain}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3 mb-2">
              <Mail size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                {t('admin.email.totalAccounts')}
              </span>
            </div>
            <p className="text-lg font-black text-slate-900">
              {emailSettings?.total_accounts || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <Settings size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {t('admin.email.totalMessages')}
              </span>
            </div>
            <p className="text-lg font-black text-slate-900">
              {emailSettings?.total_messages || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <Server size={16} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                {t('admin.email.smtpServer')}
              </span>
            </div>
            <p className="text-sm font-black text-slate-900 truncate">
              {emailSettings?.smtp_host}:{emailSettings?.smtp_port}
            </p>
          </div>
        </div>
      </div>

      {/* Domain Configuration */}
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-600">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">
              {t('admin.email.domainConfig')}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {t('admin.email.domainConfigDesc')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className={labelClasses}>
              {t('admin.email.newDomain')}
            </label>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="example.com"
              className={inputClasses}
            />
            <p className="text-xs text-slate-500 mt-2 ml-1">
              {t('admin.email.domainExample')}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpdateDomain}
              disabled={updateDomainMutation.isPending || !newDomain.trim()}
              className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-violet-700 shadow-lg shadow-violet-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {updateDomainMutation.isPending ? t('admin.email.updating') : t('admin.email.updateDomain')}
            </button>
          </div>
        </div>
      </div>

      {/* Account Recreation */}
      <div className="bg-white/70 backdrop-blur-md p-8 rounded-[2rem] border border-white shadow-[0_25px_60px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-red-50 text-red-600">
            <RefreshCw size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none tracking-tight">
              {t('admin.email.recreateTitle')}
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {t('admin.email.recreateDesc')}
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800 mb-1">
                {t('admin.email.recreateWarning')}
              </p>
              <p className="text-xs text-red-700">
                {t('admin.email.recreateWarningDesc')}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRecreateAccounts}
          disabled={recreateAccountsMutation.isPending}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          {recreateAccountsMutation.isPending ? t('admin.email.recreating') : t('admin.email.recreateAccounts')}
        </button>
      </div>
    </div>
  );
};