import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReportTask } from '../tasksApi';
import { Modal, Button } from '../../../design-system';

interface TaskReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskId: number;
}

const TaskReportModal: React.FC<TaskReportModalProps> = ({ isOpen, onClose, taskId }) => {
    const { t } = useTranslation();
    const [reportText, setReportText] = useState('');
    const reportTaskMutation = useReportTask();

    const handleSubmit = () => {
        if (!reportText.trim()) return;

        reportTaskMutation.mutate({ taskId, report: { report_text: reportText } }, {
            onSuccess: () => {
                setReportText('');
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
                    <span className="text-xl font-black text-foreground uppercase tracking-tight">{t('tasks.report_modal.title')}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-70">Формирование отчета</span>
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
                        {t('tasks.report_modal.cancel_button')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!reportText.trim() || reportTaskMutation.isPending}
                        icon={<Send size={16} strokeWidth={2.5} />}
                        iconPosition="right"
                        className="flex-1 font-black uppercase tracking-widest text-xs shadow-m3-2"
                    >
                        {reportTaskMutation.isPending ? t('tasks.report_modal.submitting') : t('tasks.report_modal.submit_button')}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <p className="text-sm text-muted-foreground font-bold opacity-80 leading-relaxed px-1">{t('tasks.report_modal.description')}</p>
                <textarea
                    className="w-full h-40 p-4 bg-surface-2 border border-border rounded-lg text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-surface transition-all resize-none shadow-inner placeholder:text-muted-foreground/40"
                    placeholder={t('tasks.report_modal.placeholder')}
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    autoFocus
                />
            </div>
        </Modal>
    );
};

export default TaskReportModal;
