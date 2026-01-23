/**
 * Admin Module - Centralized API Queries
 * All useQuery hooks for the admin panel
 */

import { useQuery } from '@tanstack/react-query';
import api from '../../../api/client';
import type {
    OverviewStats,
    ActivityStat,
    StorageStat,
    UnitStat,
    TaskUnitStat,
    ActivityLogEvent,
    SystemHealth,
} from '../types';
import type { User, Unit, AuditLog, SystemSetting } from '../../../types';
import type { Task } from '../../tasks/types';

// Overview Stats
export const useOverviewStats = () => {
    return useQuery<OverviewStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => (await api.get('/admin/stats/overview')).data,
    });
};

// Activity Data (30 days)
export const useActivityData = () => {
    return useQuery<ActivityStat[]>({
        queryKey: ['admin-activity'],
        queryFn: async () => (await api.get('/admin/stats/activity')).data,
    });
};

// Storage Stats
export const useStorageData = () => {
    return useQuery<StorageStat[]>({
        queryKey: ['admin-storage'],
        queryFn: async () => (await api.get('/admin/stats/storage')).data,
    });
};

// Unit Distribution Stats
export const useUnitStats = () => {
    return useQuery<UnitStat[]>({
        queryKey: ['admin-unit-stats'],
        queryFn: async () => (await api.get('/admin/stats/units')).data,
    });
};

// Recent Activity Feed
export const useRecentActivity = () => {
    return useQuery<ActivityLogEvent[]>({
        queryKey: ['admin-recent-activity'],
        queryFn: async () => (await api.get('/admin/activity')).data,
    });
};

// System Health (polls every 30s)
export const useSystemHealth = () => {
    return useQuery<SystemHealth>({
        queryKey: ['admin-system-health'],
        queryFn: async () => (await api.get('/admin/stats/health')).data,
        refetchInterval: 30000,
    });
};

// All Users
export const useAdminUsers = () => {
    return useQuery<User[]>({
        queryKey: ['admin-users'],
        queryFn: async () => (await api.get('/auth/users')).data,
    });
};

// All Units
export const useAdminUnits = () => {
    return useQuery<Unit[]>({
        queryKey: ['admin-units'],
        queryFn: async () => (await api.get('/auth/units')).data,
    });
};

// Active Sessions (polls every 30s)
export const useActiveSessions = () => {
    return useQuery<User[]>({
        queryKey: ['admin-sessions'],
        queryFn: async () => (await api.get('/admin/active-sessions')).data,
        refetchInterval: 30000,
    });
};

// Task Unit Stats (conditional)
export const useTaskUnitStats = (enabled: boolean) => {
    return useQuery<TaskUnitStat[]>({
        queryKey: ['admin-task-unit-stats'],
        queryFn: async () => (await api.get('/admin/stats/tasks/units')).data,
        enabled,
    });
};

// All Tasks for Admin (conditional)
export const useAllTasks = (enabled: boolean) => {
    return useQuery<(Task & { assignee?: User; issuer?: User })[]>({
        queryKey: ['admin-all-tasks'],
        queryFn: async () => (await api.get('/admin/tasks')).data,
        enabled,
    });
};

// Audit Logs
export const useAuditLogs = () => {
    return useQuery<AuditLog[]>({
        queryKey: ['admin-logs'],
        queryFn: async () => (await api.get('/admin/logs')).data,
        refetchInterval: 10000,
    });
};

// System Settings
export const useSystemSettings = () => {
    return useQuery<SystemSetting[]>({
        queryKey: ['system-settings'],
        queryFn: async () => (await api.get('/admin/settings')).data,
    });
};
