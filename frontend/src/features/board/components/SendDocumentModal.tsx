import React, { useState, useRef, useLayoutEffect, startTransition } from 'react';
import { Upload, File } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUploadAndShare } from '../boardApi';
import { useToast } from '../../../design-system';
import { Modal } from '../../../design-system/components/Modal';
import { Input } from '../../../design-system/components/Input';
import { TextArea } from '../../../design-system/components/TextArea';
import { Button } from '../../../design-system/components/Button';

interface SendDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientIds: number[];
    recipientNames: string[];
    channelName?: string;
    channelId?: number;
    preSelectedFile?: File | null;
}

const SendDocumentModal: React.FC<SendDocumentModalProps> = ({ isOpen, onClose, recipientIds, recipientNames, channelName, channelId, preSelectedFile }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { mutate: uploadAndShare, isPending } = useUploadAndShare();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        if (preSelectedFile) {
            startTransition(() => {
                setFile(preSelectedFile);
                setTitle(prev => prev || preSelectedFile.name.split('.').slice(0, -1).join('.'));
            });
        }
    }, [preSelectedFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!title) {
                setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const hasValidRecipients = channelId ? true : recipientIds.length > 0;

        if (!file || !title || !hasValidRecipients) {
            return;
        }

        uploadAndShare({ title, description, file, recipientIds, channelId }, {
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: t('board.send_modal.success_title'),
                    message: t('board.send_modal.success_message')
                });
                onClose();
                resetForm();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: t('board.send_modal.error_title'),
                    message: t('board.send_modal.error_message')
                });
            }
        });
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('board.send_modal.title')}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-[#616161] font-medium -mt-1">
                    {t('board.send_modal.to')}: <span className="font-bold text-[#242424]">{channelName ? `${t('board.send_modal.to_all')} ${channelName}` : recipientNames.join(', ')}</span>
                </p>

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        file
                            ? 'border-[#5B5FC7] bg-[#EEF2FF]'
                            : 'border-[#E0E0E0] hover:border-[#5B5FC7] hover:bg-[#F5F5F5]'
                    }`}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {file ? (
                        <div className="flex flex-col items-center">
                            <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-[#5B5FC7] mb-2">
                                <File size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-sm font-bold text-[#242424] truncate max-w-[200px]">{file.name}</span>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-[#F0F0F0] rounded-lg flex items-center justify-center text-[#616161] mb-2">
                                <Upload size={24} strokeWidth={1.5} />
                            </div>
                            <p className="text-sm font-bold text-[#242424]">{t('board.send_modal.select_file')}</p>
                        </>
                    )}
                </div>

                <Input
                    label={t('board.upload_modal.name_label')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('board.upload_modal.name_placeholder')}
                    required
                    fullWidth
                />

                <TextArea
                    label={t('board.send_modal.comment_label')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('board.send_modal.comment_placeholder')}
                    rows={3}
                    fullWidth
                />

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        fullWidth
                    >
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isPending || !file || !title}
                        loading={isPending}
                        icon={!isPending && <Upload size={18} />}
                        fullWidth
                    >
                        {t('board.send_modal.send')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SendDocumentModal;
