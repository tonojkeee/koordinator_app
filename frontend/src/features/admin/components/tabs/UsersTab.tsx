/**
 * UsersTab Component
 * User management table with search and actions
 */

import React from 'react';
import { Search, Pencil, Trash2, Shield } from 'lucide-react';

import { Card, Avatar, cn } from '../../../../design-system';
import type { UsersTabProps } from '../../types';
import type { User } from '../../../../types';

export const UsersTab: React.FC<UsersTabProps> = ({
    t,
    searchQuery,
    setSearchQuery,
    filteredUsers,
    setEditingUser,
    deleteUserMutation
}) => (
    <Card
        variant="default"
        padding="none"
        hoverable={false}
        className="overflow-hidden animate-fade-in border-border/60"
        style={{
            boxShadow: 'var(--shadow-subtle)'
        }}
    >
        {/* Search Header */}
        <div
            className="border-b border-border flex flex-col sm:flex-row justify-between items-center bg-surface-1/50 gap-6"
            style={{ padding: 'var(--spacing-lg)' }}
        >
            <div className="relative group w-full sm:w-96">
                <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 group-focus-within:text-primary transition-colors"
                    size={18}
                    strokeWidth={2.5}
                />
                <input
                    type="text"
                    placeholder={t('admin.searchUsers')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-lg text-sm font-black text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary shadow-inner placeholder:text-muted-foreground/40 uppercase tracking-widest text-[11px]"
                    style={{
                        borderRadius: 'var(--radius)',
                        transitionDuration: 'var(--duration-fast)',
                        transitionTimingFunction: 'var(--easing-out)'
                    }}
                />
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className="px-4 py-2 bg-primary/5 rounded-full border border-primary/10 shadow-sm">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                        {filteredUsers.length} {t('admin.totalUsers')}
                    </span>
                </div>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-surface-2/80 border-b border-border">
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                            {t('admin.user')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                            {t('common.unit')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] text-center">
                            {t('admin.role')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                            {t('admin.status')}
                        </th>
                        <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] text-right">
                            {t('common.actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                    {filteredUsers.map((user: User) => (
                        <tr
                            key={user.id}
                            className="hover:bg-primary/5 group active:bg-primary/10"
                            style={{
                                transitionDuration: 'var(--duration-normal)',
                                transitionTimingFunction: 'var(--easing-out)'
                            }}
                        >
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Avatar
                                            src={user.avatar_url}
                                            name={user.full_name || user.username}
                                            size="md"
                                            className="group-hover:scale-105 transition-transform duration-500 shadow-sm ring-4 ring-transparent group-hover:ring-primary/10"
                                        />
                                        {user.status === 'active' && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-surface rounded-full shadow-sm" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-black text-foreground text-sm truncate group-hover:text-primary transition-colors tracking-tight">
                                            {user.full_name || user.username}
                                        </div>
                                        <div className="text-[10px] font-bold text-primary opacity-60 uppercase tracking-widest">
                                            @{user.username}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-black text-foreground tracking-tight">
                                        {user.unit_name || user.unit?.name || t('admin.noUnit')}
                                    </span>
                                    {user.position && (
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                                            {user.position}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                                <span className={cn(
                                    "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm transition-all",
                                    user.role === 'admin'
                                        ? 'bg-primary text-white border-primary'
                                        : user.role === 'operator'
                                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                                            : 'bg-surface-3 text-muted-foreground border-border/50'
                                )}
                                style={{
                                    boxShadow: user.role === 'admin' ? 'var(--shadow-subtle)' : 'var(--shadow-subtle)'
                                }}
                                >
                                    {user.role === 'admin'
                                        ? t('admin.roleAdmin')
                                        : user.role === 'operator'
                                            ? t('admin.roleOperator')
                                            : t('admin.roleUser')}
                                </span>
                            </td>
                            <td className="px-8 py-5">
                                <div className="flex flex-col gap-1.5">
                                    <span className={cn(
                                        "inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded-lg border",
                                        user.status === 'active'
                                            ? 'text-green-700 bg-green-500/5 border-green-500/10'
                                            : user.status === 'on_leave'
                                                ? 'text-amber-700 bg-amber-500/5 border-amber-500/10'
                                                : user.status === 'away'
                                                    ? 'text-muted-foreground bg-surface-3 border-border/50'
                                                    : 'text-destructive bg-destructive/5 border-destructive/10'
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full shadow-[0_0_6px_currentColor]",
                                            user.status === 'active'
                                                ? 'bg-green-500'
                                                : user.status === 'on_leave'
                                                    ? 'bg-amber-500'
                                                    : user.status === 'away'
                                                        ? 'bg-muted-foreground/40'
                                                        : 'bg-destructive'
                                        )} />
                                        {t(`admin.status${user.status.charAt(0).toUpperCase() + user.status.slice(1)}`)}
                                    </span>
                                    {!user.is_active && (
                                        <span className="text-[8px] font-black text-destructive uppercase tracking-widest pl-1 flex items-center gap-1.5 opacity-80">
                                            <Shield size={10} strokeWidth={3} />
                                            {t('admin.accessDenied')}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => setEditingUser(user)}
                                        className="w-9 h-9 flex items-center justify-center bg-surface-2 text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border/50 shadow-sm"
                                        title={t('common.edit')}
                                        style={{
                                            borderRadius: 'var(--radius)',
                                            transitionDuration: 'var(--duration-fast)',
                                            transitionTimingFunction: 'var(--easing-out)'
                                        }}
                                    >
                                        <Pencil size={16} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(t('admin.deleteConfirm'))) {
                                                deleteUserMutation.mutate(user.id);
                                            }
                                        }}
                                        className="w-9 h-9 flex items-center justify-center bg-surface-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/50 shadow-sm"
                                        title={t('common.delete')}
                                        style={{
                                            borderRadius: 'var(--radius)',
                                            transitionDuration: 'var(--duration-fast)',
                                            transitionTimingFunction: 'var(--easing-out)'
                                        }}
                                    >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
);

export default UsersTab;
