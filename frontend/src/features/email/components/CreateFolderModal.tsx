import React, { useState } from 'react';
import { Modal, Button } from '../../../design-system';
import { useTranslation } from 'react-i18next';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate }) => {
    const { t } = useTranslation();
    const [folderName, setFolderName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (folderName.trim()) {
            onCreate(folderName);
            setFolderName('');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('email.create_folder_modal.title')}
            size="sm"
            footer={
                <>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        fullWidth
                    >
                        {t('email.create_folder_modal.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!folderName.trim()}
                        fullWidth
                    >
                        {t('email.create_folder_modal.create')}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-[#888888] uppercase tracking-widest mb-2 px-1">
                        {t('email.create_folder_modal.name_placeholder')}
                    </label>
                    <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder={t('email.create_folder_modal.name_placeholder')}
                        className="w-full h-11 px-4 bg-[#F5F5F5] border border-[#E0E0E0] rounded-md text-sm font-semibold focus:outline-none focus:bg-white focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7] transition-all placeholder:text-[#888888]"
                        autoFocus
                    />
                </div>
            </form>
        </Modal>
    );
};

export default CreateFolderModal;
