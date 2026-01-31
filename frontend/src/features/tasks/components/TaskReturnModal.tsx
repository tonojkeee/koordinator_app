import React, { useState } from 'react';
import { CornerUpLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useRejectTask } from '../tasksApi';
import { Modal, Button } from '../../../design-system';

interface TaskReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
}

const TaskReturnModal: React.FC<TaskReturnModalProps> = ({ isOpen, onClose, taskId }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const rejectTaskMutation = useRejectTask();

    const handleSubmit = () => {
        if (!reason.trim()) return;

        rejectTaskMutation.mutate({ taskId, reason }, {
            onSuccess: () => {
                setReason('');
                onClose();
            }
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col">
                    <span className="text-xl font-black text-foreground uppercase tracking-tight">{t('tasks.return_modal.title')}</span>
                    <span className="text-[10px] font-black text-destructive uppercase tracking-[0.2em] mt-1 opacity-70">Возврат на доработку</span>
                </div>
            }
            size="md"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 font-black uppercase tracking-widest text-xs"
                    >
                        {t('tasks.return_modal.cancel_button')}
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleSubmit}
                        disabled={!reason.trim() || rejectTaskMutation.isPending}
                        icon={<CornerUpLeft size={16} strokeWidth={2.5} />}
                        iconPosition="right"
                        className="flex-1 font-black uppercase tracking-widest text-xs shadow-m3-2"
                    >
                        {rejectTaskMutation.isPending ? t('tasks.return_modal.submitting') : t('tasks.return_modal.submit_button')}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground font-bold opacity-80 leading-relaxed px-1">{t('tasks.return_modal.description')}</p>
                <textarea
                    className="w-full h-40 p-4 bg-surface-2 border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/10 focus:border-destructive focus:bg-surface transition-all resize-none shadow-inner placeholder:text-muted-foreground/40"
                    placeholder={t('tasks.return_modal.placeholder')}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    autoFocus
                />
            </div>
        </Modal>
    );
};

export default TaskReturnModal;
