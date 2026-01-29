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
                <div className="flex items-center gap-3 w-full">
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
                        className="bg-cyan-700 hover:bg-cyan-800 text-white shadow-md shadow-cyan-500/20"
                    >
                        {t('email.create_folder_modal.create')}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                        {t('email.create_folder_modal.name_placeholder')}
                    </label>
                    <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder={t('email.create_folder_modal.name_placeholder')}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/5 transition-all placeholder:text-slate-400 placeholder:font-medium"
                        autoFocus
                    />
                </div>
            </form>
        </Modal>
    );
};

export default CreateFolderModal;
