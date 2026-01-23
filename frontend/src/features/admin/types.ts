/**
 * Admin Module Types
 * Centralized type definitions for the admin panel
 */

import type { User, Unit } from '../../types';
import type { Task } from '../tasks/types';
import type { TFunction } from 'i18next';

// Stats Types
export interface OverviewStats {
    total_users: number;
    online_users: number;
    messages_today: number;
    total_files: number;
    total_storage_size: number;
    tasks_total: number;
    tasks_completed: number;
    tasks_in_progress: number;
    tasks_on_review: number;
    tasks_overdue: number;
}

export interface ActivityStat {
    date: string;
    messages: number;
    new_users: number;
    new_tasks: number;
}

export interface StorageStat {
    name: string;
    value: number;
    count: number;
    color: string;
}

export interface UnitStat {
    name: string;
    value: number;
}

export interface TaskUnitStat {
    name: string;
    total: number;
    completed: number;
}

export interface ActivityLogEvent {
    id: string;
    type: 'new_user' | 'new_document' | 'system' | 'new_task_event';
    user: string;
    description: string;
    timestamp: string;
}

export interface SystemHealth {
    uptime: string;
    cpu_load: number;
    ram_usage: number;
    status: string;
}

export interface DatabaseConfig {
    type: 'sqlite' | 'mysql' | 'postgresql';
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
}

// Component Props Types
export interface OverviewTabProps {
    t: TFunction;
    stats: OverviewStats | undefined;
    activityData: ActivityStat[] | undefined;
    storageData: StorageStat[] | undefined;
    unitStats: UnitStat[] | undefined;
    recentActivity: ActivityLogEvent[] | undefined;
    systemHealth?: SystemHealth;
    onViewLogs: () => void;
}

export interface UsersTabProps {
    t: TFunction;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredUsers: User[];
    setEditingUser: (user: User | null) => void;
    deleteUserMutation: {
        mutate: (id: number) => void;
        isPending: boolean;
    };
}

export interface UnitsTabProps {
    t: TFunction;
    units: Unit[] | undefined;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setEditingUnit: (unit: Partial<Unit> | null) => void;
    deleteUnitMutation: {
        mutate: (id: number) => void;
        isPending: boolean;
    };
}

export interface TasksTabProps {
    t: TFunction;
    stats: OverviewStats | undefined;
    taskUnitStats: TaskUnitStat[] | undefined;
    allTasks: (Task & { assignee?: User; issuer?: User })[] | undefined;
    isLoading: boolean;
    onDeleteTask: (taskId: number) => void;
}

export interface SessionsTabProps {
    t: TFunction;
    sessions: User[] | undefined;
    isLoading: boolean;
}

export interface EditUserModalProps {
    user: User;
    units: Unit[];
    onClose: () => void;
    onSave: (id: number, data: Partial<User>) => void;
    onResetPassword: (id: number, pass: string) => void;
    t: TFunction;
}

export interface EditUnitModalProps {
    unit: Partial<Unit>;
    onClose: () => void;
    onSave: (data: Partial<Unit>) => void;
    t: TFunction;
}

export interface LogsModalProps {
    onClose: () => void;
    t: TFunction;
}
