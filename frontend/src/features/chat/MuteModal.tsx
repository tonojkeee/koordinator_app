import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../design-system/components/Modal';
import { Button } from '../../design-system/components/Button';

interface MuteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onMute: (duration: '1h' | '8h' | '24h' | 'forever' | null) => void;
}

const MuteModal: React.FC<MuteModalProps> = ({ isOpen, onClose, onMute }) => {
    const { t } = useTranslation();

    const handleMute = (duration: '1h' | '8h' | '24h' | 'forever' | null) => {
        onMute(duration);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('chat.notifications.muteTitle')}
            size="sm"
        >
            <div className="flex flex-col space-y-1">
                {[
                    { label: t('chat.notifications.1h'), value: '1h' },
                    { label: t('chat.notifications.8h'), value: '8h' },
                    { label: t('chat.notifications.24h'), value: '24h' },
                    { label: t('chat.notifications.forever'), value: 'forever' },
                ].map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleMute(option.value as '1h' | '8h' | '24h' | 'forever')}
                        className="w-full text-left px-4 py-2 rounded-md hover:bg-[#F0F0F0] text-[#242424] font-medium transition-colors"
                    >
                        {option.label}
                    </button>
                ))}

                <div className="h-px bg-[#E0E0E0] my-2" />

                <Button
                    variant="danger"
                    fullWidth
                    onClick={() => handleMute(null)}
                    className="justify-center"
                >
                    {t('chat.notifications.unmute')}
                </Button>
            </div>
        </Modal>
    );
};

export default MuteModal;
