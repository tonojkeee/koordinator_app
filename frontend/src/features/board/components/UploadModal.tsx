import React, { useState, useRef } from 'react';
import { X, Upload, File, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUploadDocument } from '../boardApi';
import { useToast } from '../../../design-system';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const { mutate: uploadDoc, isPending } = useUploadDocument();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            if (!title) {
                // Auto-fill title with filename without extension
                setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) return;

        uploadDoc({ title, description, file }, {
            onSuccess: () => {
                addToast({
                    type: 'success',
                    title: t('board.upload_modal.success_title'),
                    message: t('board.upload_modal.success_message'),
                });
                onClose();
                resetForm();
            },
            onError: () => {
                addToast({
                    type: 'error',
                    title: t('board.upload_modal.error_title'),
                    message: t('board.upload_modal.error_message'),
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[hsl(0_0%_12%)]/60 backdrop-blur-xl animate-in fade-in duration-[var(--duration-normal)]">
            <div
                className="bg-card/95 backdrop-blur-2xl w-full max-w-lg overflow-hidden animate-zoom-in border border-border"
                style={{
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-strong)'
                }}
            >
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                        <div>
                            <h2 className="text-xl font-black text-secondary tracking-tight uppercase">{t('board.upload_modal.title')}</h2>
                            <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">{t('board.upload_modal.subtitle')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2.5 text-tertiary hover:text-danger hover:bg-danger/10 transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-5">
                        {/* Dropzone/File Input */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] ${file
                                ? 'border-primary bg-primary/5 shadow-subtle'
                                : 'border-border hover:border-primary hover:bg-surface-2'
                                }`}
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            {file ? (
                                <div className="flex flex-col items-center animate-zoom-in">
                                    <div
                                        className="w-14 h-14 bg-card shadow-subtle flex items-center justify-center text-primary mb-3"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        <File size={28} />
                                    </div>
                                    <span className="text-xs font-bold text-secondary">{file.name}</span>
                                    <span className="text-[9px] font-bold text-tertiary uppercase tracking-widest mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div
                                        className="w-14 h-14 bg-surface-2 flex items-center justify-center text-tertiary mb-3 transition-colors duration-[var(--duration-fast)] ease-[var(--easing-out)]"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        <Upload size={28} />
                                    </div>
                                    <p className="text-xs font-bold text-secondary">{t('board.upload_modal.click_to_select')}</p>
                                    <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest mt-1 opacity-60">{t('board.upload_modal.allowed_formats')}</p>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-bold text-tertiary uppercase tracking-widest mb-1.5 px-1">{t('board.upload_modal.name_label')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full h-11 px-4 bg-surface-2 border border-border text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)] text-secondary placeholder:text-tertiary/50"
                                    style={{ borderRadius: 'var(--radius)' }}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={t('board.upload_modal.name_placeholder')}
                                />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-tertiary uppercase tracking-widest mb-1.5 px-1">{t('board.upload_modal.description_label')}</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-surface-2 border border-border text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/40 transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)] min-h-[90px] resize-none text-secondary placeholder:text-tertiary/50"
                                    style={{ borderRadius: 'var(--radius)' }}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('board.upload_modal.description_placeholder')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 border border-border text-secondary text-sm font-bold hover:bg-surface-2 hover:shadow-subtle transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isPending || !file || !title}
                            className="flex-1 h-11 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary text-white text-sm font-bold shadow-subtle hover:shadow-medium hover:-translate-y-0.5 active:shadow-subtle active:translate-y-0.5 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] flex items-center justify-center space-x-2"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {isPending ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Upload size={18} />
                                    <span>{t('board.upload')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
