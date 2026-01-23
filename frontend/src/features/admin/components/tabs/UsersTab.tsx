/**
 * UsersTab Component
 * User management table with search and actions
 */

import React from 'react';
import { Search, Pencil, Trash2, Shield } from 'lucide-react';

import { Card, Avatar, Button } from '../../../../design-system';
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
    <Card variant="elevated" padding="none" hoverable={false} className="overflow-hidden animate-in fade-in duration-300">
        {/* Search Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/30">
            <div className="relative group">
                <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                    size={18}
                />
                <input
                    type="text"
                    placeholder={t('admin.searchUsers')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-slate-100/50 border-none rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 w-72 transition-all placeholder:text-slate-400"
                />
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {filteredUsers.length} {t('admin.totalUsers')}
                </span>
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('admin.user')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('common.unit')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                            {t('admin.role')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('admin.status')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                            {t('common.actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                    {filteredUsers.map((user: User) => (
                        <tr
                            key={user.id}
                            className="hover:bg-indigo-50/30 transition-all duration-200 group"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar
                                        src={user.avatar_url}
                                        name={user.full_name || user.username}
                                        size="sm"
                                        className="group-hover:scale-105 transition-transform"
                                    />
                                    <div className="min-w-0">
                                        <div className="font-semibold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
                                            {user.full_name || user.username}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate">
                                            @{user.username}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-semibold text-slate-700">
                                        {user.unit_name || user.unit?.name || t('admin.noUnit')}
                                    </span>
                                    {user.position && (
                                        <span className="text-[10px] text-slate-400">
                                            {user.position}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${user.role === 'admin'
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : user.role === 'operator'
                                            ? 'bg-teal-50 text-teal-700'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {user.role === 'admin'
                                        ? t('admin.roleAdmin')
                                        : user.role === 'operator'
                                            ? t('admin.roleOperator')
                                            : t('admin.roleUser')}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${user.status === 'active'
                                            ? 'text-emerald-600 bg-emerald-50'
                                            : user.status === 'on_leave'
                                                ? 'text-amber-600 bg-amber-50'
                                                : user.status === 'away'
                                                    ? 'text-slate-500 bg-slate-50'
                                                    : 'text-rose-600 bg-rose-50'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active'
                                                ? 'bg-emerald-500'
                                                : user.status === 'on_leave'
                                                    ? 'bg-amber-500'
                                                    : user.status === 'away'
                                                        ? 'bg-slate-400'
                                                        : 'bg-rose-500'
                                            }`} />
                                        {t(`admin.status${user.status.charAt(0).toUpperCase() + user.status.slice(1)}`)}
                                    </span>
                                    {!user.is_active && (
                                        <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wide pl-2 flex items-center gap-1">
                                            <Shield size={8} />
                                            {t('admin.accessDenied')}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Pencil size={16} />}
                                        onClick={() => setEditingUser(user)}
                                        className="text-slate-400 hover:text-indigo-600"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Trash2 size={16} />}
                                        onClick={() => {
                                            if (window.confirm(t('admin.deleteConfirm'))) {
                                                deleteUserMutation.mutate(user.id);
                                            }
                                        }}
                                        className="text-slate-400 hover:text-rose-600"
                                    />
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
