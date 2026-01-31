import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Clock, CheckCircle2, User,
    CornerDownRight, FileText, XCircle, Trash2,
    CornerUpLeft, UserCheck
} from 'lucide-react';
import type { Task } from '../types';
import { TaskPriority, TaskStatus } from '../types';
import TaskReportModal from './TaskReportModal';
import TaskReturnModal from './TaskReturnModal';
import { formatName, abbreviateRank } from '../../../utils/formatters';
import { Card, ContextMenu, type ContextMenuOption, Button, cn } from '../../../design-system';

interface TaskCardProps {
    task: Task;
    variant: 'received' | 'issued' | 'completed';
    onConfirm?: (taskId: number) => void;
    onReject?: (taskId: number) => void;
    onDelete?: (taskId: number) => void;
    highlighted?: boolean;
    currentUserId: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, variant, onConfirm, onDelete, highlighted, currentUserId }) => {
    const { t } = useTranslation();
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (highlighted && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [highlighted]);

    const isOverdue = task.status === TaskStatus.OVERDUE;
    const isCompleted = task.status === TaskStatus.COMPLETED;
    const isOnReview = task.status === TaskStatus.ON_REVIEW;

    const isIssuer = task.issuer_id === currentUserId;
    const isAssignee = task.assignee_id === currentUserId;

    const getStatusColor = () => {
        switch (task.status) {
            case TaskStatus.COMPLETED:
                return 'bg-success/5 text-success border-success/15 hover:bg-success/10';
            case TaskStatus.OVERDUE:
                return 'bg-danger/5 text-danger border-danger/15 hover:bg-danger/10 animate-pulse';
            case TaskStatus.ON_REVIEW:
                return 'bg-warning/5 text-warning border-warning/15 hover:bg-warning/10';
            default:
                return 'bg-surface-2 text-tertiary border-border/50 hover:bg-surface-3 hover:text-secondary';
        }
    };

    const getPriorityColor = () => {
        return task.priority === TaskPriority.HIGH
            ? 'bg-danger/5 text-danger border-danger/15 hover:bg-danger/10'
            : 'bg-primary/5 text-primary border-primary/15 hover:bg-primary/10';
    };

    const formatDate = (dateStr: string) => {
        try {
            const isoString = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
            return new Intl.DateTimeFormat('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(isoString));
        } catch {
            return dateStr;
        }
    };

    const handleDelete = () => {
        if (window.confirm(t('tasks.card.delete_confirm'))) {
            onDelete?.(task.id);
        }
    };

    const contextOptions: ContextMenuOption[] = [];

    if (isAssignee && (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.OVERDUE)) {
        contextOptions.push({
            label: t('tasks.card.report_button'),
            icon: CornerDownRight,
            onClick: () => setIsReportModalOpen(true)
        });
    }

    if (isIssuer && task.status === TaskStatus.ON_REVIEW) {
        contextOptions.push({
            label: t('tasks.card.accept_button'),
            icon: CheckCircle2,
            onClick: () => onConfirm?.(task.id)
        });
        contextOptions.push({
            label: t('tasks.card.return_button'),
            icon: XCircle,
            onClick: () => setIsReturnModalOpen(true)
        });
    }

    contextOptions.push({
        label: t('chat.copy_text') || 'Copy Text',
        icon: FileText,
        onClick: () => {
            navigator.clipboard.writeText(`${task.title}\n\n${task.description}`);
        },
        divider: contextOptions.length > 0
    });

    if (isIssuer && onDelete) {
        contextOptions.push({
            label: t('tasks.card.delete_button'),
            icon: Trash2,
            variant: 'danger',
            onClick: handleDelete,
            divider: true
        });
    }

    return (
        <div ref={cardRef}>
            <ContextMenu options={contextOptions}>
                <Card
                    selected={highlighted}
                    hoverable={!isCompleted}
                    padding="lg"
                    className={`
                        relative transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] group shadow-subtle
                        ${!isCompleted ? 'hover:shadow-medium hover:-translate-y-0.5' : ''}
                        ${isCompleted ? 'opacity-60 hover:opacity-100' : ''}
                        ${isOverdue && !isCompleted ? 'ring-2 ring-danger/20 ring-inset' : ''}
                        ${highlighted ? '[box-shadow:var(--shadow-strong)]' : ''}
                    `}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 pr-4">
                            <h3 className={cn(
                                "text-sm font-bold leading-tight tracking-tight transition-colors duration-[var(--duration-fast)] ease-[var(--easing-out)]",
                                isCompleted ? 'text-tertiary/40 line-through' : 'text-secondary group-hover:text-primary'
                            )}>
                                {task.title}
                            </h3>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-subtle transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)]", getPriorityColor())}>
                                {task.priority === TaskPriority.HIGH ? t('tasks.priority.high') : t('tasks.priority.medium')}
                            </span>
                            <span className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-subtle transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)]", getStatusColor())}>
                                {isOnReview ? t('tasks.status.on_review') :
                                    isOverdue ? t('tasks.status.overdue') :
                                        isCompleted ? t('tasks.status.completed') : t('tasks.status.in_progress')}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs text-tertiary font-medium mb-6 line-clamp-4 whitespace-pre-wrap leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity duration-[var(--duration-normal)] ease-[var(--easing-out)]">
                        {task.description}
                    </p>

                    {task.completion_report && (
                        <div className="mb-5 bg-surface-2 p-3.5 rounded-lg border border-border/50 shadow-inner group/report transition-colors hover:bg-surface-3/50">
                            <div className="flex items-center gap-2 mb-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-60">
                                <FileText size={12} strokeWidth={2.5} />
                                {t('tasks.card.report_label')}
                            </div>
                            <p className="text-xs text-foreground font-bold italic whitespace-pre-wrap break-words leading-relaxed">
                                "{task.completion_report}"
                            </p>
                        </div>
                    )}

                    {task.status === TaskStatus.IN_PROGRESS && task.return_reason && (
                        <div className="mb-5 bg-destructive/5 p-3.5 rounded-lg border border-destructive/10 shadow-inner">
                            <div className="flex items-center gap-2 mb-1.5 text-[9px] font-black text-destructive uppercase tracking-[0.15em] opacity-80">
                                <CornerUpLeft size={12} strokeWidth={2.5} />
                                {t('tasks.card.return_label')}
                            </div>
                            <p className="text-xs text-destructive font-bold italic whitespace-pre-wrap break-words leading-relaxed">
                                "{task.return_reason}"
                            </p>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-tertiary font-bold border-t border-border/60 pt-4 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-surface-2 text-tertiary flex items-center justify-center border border-border shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)]">
                                    {isIssuer ? <User size={14} strokeWidth={2} /> : <UserCheck size={14} strokeWidth={2} />}
                                </div>
                                <span className="truncate max-w-[180px] group-hover:text-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--easing-out)]" title={variant === 'received' ? task.issuer?.full_name : task.assignee?.full_name}>
                                    {(() => {
                                        const user = variant === 'received' ? task.issuer : task.assignee;
                                        if (!user) return t(variant === 'received' ? 'tasks.card.fallback_issuer' : 'tasks.card.fallback_assignee');

                                        const name = formatName(user.full_name, user.username);
                                        const rank = abbreviateRank(user.rank);

                                        return rank ? `${rank} ${name}` : name;
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isCompleted && task.completed_at ? (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/5 border border-success/15 text-success shadow-subtle transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)] hover:bg-success/10">
                                    <CheckCircle2 size={12} strokeWidth={3} />
                                    <span className="font-black">
                                        {formatDate(task.completed_at)}
                                    </span>
                                </div>
                            ) : (
                                <div className={cn(
                                    "flex items-center gap-2 px-2.5 py-1 rounded-full border shadow-subtle transition-all duration-[var(--duration-fast)] ease-[var(--easing-out)]",
                                    isOverdue ? 'bg-danger/5 border-danger/15 text-danger hover:bg-danger/10' : 'bg-surface-2 border-border text-tertiary hover:bg-surface-3'
                                )}>
                                    <Clock size={12} strokeWidth={3} />
                                    <span className="font-black">
                                        {formatDate(task.deadline)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!isCompleted && (
                        <div className="mt-5 flex justify-end gap-3 items-center">
                            {isAssignee && (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.OVERDUE) && (
                                <Button
                                    onClick={() => setIsReportModalOpen(true)}
                                    variant="primary"
                                    size="sm"
                                    icon={<CornerDownRight size={16} strokeWidth={2.5} />}
                                    className="font-black uppercase tracking-widest text-[9px] shadow-medium hover:shadow-strong hover:-translate-y-0.5 active:shadow-subtle active:translate-y-0 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] rounded-lg px-4"
                                >
                                    {t('tasks.card.report_button')}
                                </Button>
                            )}

                            {isIssuer && task.status === TaskStatus.ON_REVIEW && (
                                <>
                                    <Button
                                        onClick={() => setIsReturnModalOpen(true)}
                                        variant="ghost"
                                        size="sm"
                                        icon={<XCircle size={16} strokeWidth={2.5} />}
                                        className="font-black uppercase tracking-widest text-[9px] text-danger hover:bg-danger/5 hover:text-danger hover:shadow-subtle active:bg-danger/10 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] rounded-lg px-4"
                                    >
                                        {t('tasks.card.return_button')}
                                    </Button>
                                    <Button
                                        onClick={() => onConfirm?.(task.id)}
                                        variant="primary"
                                        size="sm"
                                        icon={<CheckCircle2 size={16} strokeWidth={2.5} />}
                                        className="font-black uppercase tracking-widest text-[9px] shadow-medium hover:shadow-strong hover:-translate-y-0.5 active:shadow-subtle active:translate-y-0 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] rounded-lg px-4 scale-105"
                                    >
                                        {t('tasks.card.accept_button')}
                                    </Button>
                                </>
                            )}

                            {isIssuer && onDelete && (
                                <button
                                    onClick={handleDelete}
                                    className="ml-auto w-9 h-9 flex items-center justify-center bg-surface-2 border border-border text-muted-foreground hover:text-danger hover:border-danger/30 hover:bg-danger/5 hover:shadow-subtle active:scale-95 transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] rounded-lg shadow-subtle"
                                    title={t('tasks.card.delete_button')}
                                >
                                    <Trash2 size={18} strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    )}
                </Card>
            </ContextMenu>

            <TaskReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                taskId={task.id}
            />
            <TaskReturnModal
                isOpen={isReturnModalOpen}
                onClose={() => setIsReturnModalOpen(false)}
                taskId={task.id}
            />
        </div>
    );
};

export default TaskCard;
