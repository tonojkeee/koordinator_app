import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, Lock } from 'lucide-react';

import { Modal } from '../../../design-system/components/Modal';
import { Button } from '../../../design-system/components/Button';
import { Input } from '../../../design-system/components/Input';
import { cn } from '../../../design-system/utils/cn';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, visibility: 'public' | 'private') => void;
}

export function CreateChannelModal({ isOpen, onClose, onCreate }: CreateChannelModalProps) {
  const { t } = useTranslation();
  const [channelName, setChannelName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channelName.trim()) {
      onCreate(channelName.trim(), visibility);
      setChannelName('');
      setVisibility('public');
      onClose();
    }
  };

  const handleClose = () => {
    setChannelName('');
    setVisibility('public');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={visibility === 'public' ? t('chat.create_public_channel') : t('chat.create_private_channel')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label={t('chat.channel_name')}
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          placeholder={t('chat.channel_name')}
          autoFocus
          fullWidth
        />

        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            {t('chat.channel_visibility')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVisibility('public')}
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-left',
                visibility === 'public'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  visibility === 'public' ? 'bg-indigo-500' : 'bg-slate-400'
                )}>
                  <Hash className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">
                    {t('chat.public_channel')}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {t('chat.public_channel_description')}
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVisibility('private')}
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-left',
                visibility === 'private'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  visibility === 'private' ? 'bg-indigo-500' : 'bg-slate-400'
                )}>
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">
                    {t('chat.private_channel')}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {t('chat.private_channel_description')}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            fullWidth
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!channelName.trim()}
            fullWidth
          >
            {visibility === 'public' ? t('chat.create_public_channel') : t('chat.create_private_channel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}