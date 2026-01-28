import React, { useState } from 'react';
import { Send, User, Users, Calendar, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../api/client';
import { useCreateTask } from '../tasksApi';
import { TaskPriority } from '../types';
import type { User as IUser, Unit } from '../../../types';
import { formatName, abbreviateRank } from '../../../utils/formatters';
import { Modal, Button, cn } from '../../../design-system';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const createTaskMutation = useCreateTask();

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('18:00');

    const [targetType, setTargetType] = useState<'user' | 'unit'>('user');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const [userFilterUnitId, setUserFilterUnitId] = useState<number | null>(null);

    // Fetch Data
    const { data: users } = useQuery<IUser[]>({
        queryKey: ['users'],
        queryFn: async () => (await api.get('/auth/users')).data,
        enabled: isOpen,
    });

    const { data: units } = useQuery<Unit[]>({
        queryKey: ['units'],
        queryFn: async () => (await api.get('/auth/units')).data,
        enabled: isOpen,
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!title || !description || !deadlineDate || (!selectedUserId && !selectedUnitId)) return;

        const deadline = new Date(`${deadlineDate}T${deadlineTime}`).toISOString();

        createTaskMutation.mutate({
            title,
            description,
            priority,
            deadline,
            assignee_id: targetType === 'user' ? selectedUserId : null,
            unit_id: targetType === 'unit' ? selectedUnitId : null,
        }, {
            onSuccess: () => {
                // Reset form
                setTitle('');
                setDescription('');
                setSelectedUserId(null);
                setSelectedUnitId(null);
                setUserFilterUnitId(null);
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
                    <span className="text-xl font-black text-foreground uppercase tracking-tight">{t('tasks.create_modal.title')}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1 opacity-70">Новое поручение</span>
                </div>
            }
            size="lg"
            footer={
                <>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 sm:flex-none font-black uppercase tracking-widest text-xs"
                    >
                        {t('tasks.create_modal.cancel_button')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!title || !description || !deadlineDate || (!selectedUserId && !selectedUnitId) || createTaskMutation.isPending}
                        icon={<Send size={18} strokeWidth={2.5} />}
                        iconPosition="right"
                        className="flex-1 sm:flex-none font-black uppercase tracking-widest text-xs shadow-m3-2 px-8 scale-105"
                    >
                        {createTaskMutation.isPending ? t('tasks.create_modal.submitting') : t('tasks.create_modal.submit_button')}
                    </Button>
                </>
            }
        >
            <div className="space-y-7">
                {/* 1. Target Selection */}
                <div className="space-y-4">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70">{t('tasks.create_modal.assignee_label')}</label>
                        <div className="flex bg-surface-3 p-1 rounded-2xl w-fit mb-4 border border-border shadow-inner">
                            <button
                                onClick={() => setTargetType('user')}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95",
                                    targetType === 'user' ? 'bg-surface shadow-m3-1 text-primary' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <User size={16} strokeWidth={2.5} />
                                {t('tasks.create_modal.assignee_user')}
                            </button>
                            <button
                                onClick={() => setTargetType('unit')}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2.5 active:scale-95",
                                    targetType === 'unit' ? 'bg-surface shadow-m3-1 text-primary' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Users size={16} strokeWidth={2.5} />
                                {t('tasks.create_modal.assignee_unit')}
                            </button>
                        </div>

                        {targetType === 'user' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-500">
                                {/* Unit Filter for User Selection */}
                                <div className="relative group">
                                    <select
                                        className="w-full h-11 px-4 pr-10 bg-surface-2 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                                        value={userFilterUnitId || ''}
                                        onChange={(e) => {
                                            setUserFilterUnitId(Number(e.target.value));
                                            setSelectedUserId(null); // Reset user when unit changes
                                        }}
                                    >
                                        <option value="">{t('tasks.create_modal.select_unit')}</option>
                                        {units?.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Filtered User Select */}
                                <div className="relative group">
                                    <select
                                        className="w-full h-11 px-4 pr-10 bg-surface-2 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        value={selectedUserId || ''}
                                        onChange={(e) => setSelectedUserId(Number(e.target.value))}
                                        disabled={!userFilterUnitId}
                                    >
                                        <option value="">
                                            {userFilterUnitId
                                                ? t('tasks.create_modal.select_user')
                                                : t('tasks.create_modal.select_user_first')
                                            }
                                        </option>
                                        {users
                                            ?.filter(u => userFilterUnitId ? u.unit_id === userFilterUnitId : false)
                                            .map(user => {
                                                const rank = abbreviateRank(user.rank);
                                                const name = formatName(user.full_name, user.username);
                                                const position = user.position || t('tasks.create_modal.fallback_position');
                                                const label = rank ? `${rank} ${name} (${position})` : `${name} (${position})`;

                                                return (
                                                    <option key={user.id} value={user.id}>
                                                        {label}
                                                    </option>
                                                );
                                            })
                                        }
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative group animate-in fade-in duration-500">
                                <select
                                    className="w-full h-11 px-4 pr-10 bg-surface-2 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                                    value={selectedUnitId || ''}
                                    onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                                >
                                    <option value="">{t('tasks.create_modal.select_unit_target')}</option>
                                    {units?.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-primary transition-colors">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        )}
                        {targetType === 'unit' && (
                            <div className="text-[10px] text-amber-700 font-black uppercase tracking-widest flex items-center gap-3 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 animate-scale-in">
                                <AlertCircle size={16} strokeWidth={2.5} className="text-amber-600" />
                                {t('tasks.create_modal.unit_warning')}
                            </div>
                        )}
                    </div>

                    {/* 2. Task Details */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70">{t('tasks.create_modal.details_label')}</label>
                        <input
                            type="text"
                            placeholder={t('tasks.create_modal.title_placeholder')}
                            className="w-full h-11 px-4 bg-surface-2 border border-border rounded-xl text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-surface transition-all shadow-inner placeholder:text-muted-foreground/40"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <textarea
                            placeholder={t('tasks.create_modal.description_placeholder')}
                            className="w-full h-32 p-4 bg-surface-2 border border-border rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary focus:bg-surface transition-all resize-none shadow-inner placeholder:text-muted-foreground/40"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* 3. Deadlines & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70 flex items-center gap-2">
                                <Calendar size={14} strokeWidth={2.5} /> {t('tasks.create_modal.deadline_label')}
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="date"
                                    className="flex-1 h-11 px-4 bg-surface-2 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                    value={deadlineDate}
                                    onChange={(e) => setDeadlineDate(e.target.value)}
                                />
                                <input
                                    type="time"
                                    className="w-28 h-11 px-4 bg-surface-2 border border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                    value={deadlineTime}
                                    onChange={(e) => setDeadlineTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70">{t('tasks.create_modal.priority_label')}</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPriority(TaskPriority.MEDIUM)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all active:scale-95",
                                        priority === TaskPriority.MEDIUM
                                            ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                            : 'bg-surface border-border text-muted-foreground hover:bg-surface-2'
                                    )}
                                >
                                    {t('tasks.create_modal.priority_medium')}
                                </button>
                                <button
                                    onClick={() => setPriority(TaskPriority.HIGH)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all active:scale-95",
                                        priority === TaskPriority.HIGH
                                            ? 'bg-destructive/10 border-destructive text-destructive shadow-sm'
                                            : 'bg-surface border-border text-muted-foreground hover:bg-surface-2'
                                    )}
                                >
                                    {t('tasks.create_modal.priority_high')}
                                </button>
                            </div>
                        </div>
                    </div>
            </div>
        </Modal>
    );
};

export default CreateTaskModal;
