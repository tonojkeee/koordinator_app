/**
 * UnitsTab Component
 * Department/Unit management table
 */

import React from 'react';
import { Search, Building2, Pencil, Trash2 } from 'lucide-react';

import { Card, Button } from '../../../../design-system';
import type { UnitsTabProps } from '../../types';
import type { Unit } from '../../../../types';

export const UnitsTab: React.FC<UnitsTabProps> = ({
    t,
    units,
    searchQuery,
    setSearchQuery,
    setEditingUnit,
    deleteUnitMutation
}) => {
    const filteredUnits = units?.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <Card variant="elevated" padding="none" hoverable={false} className="overflow-hidden animate-in fade-in duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white/30">
                <div className="relative group">
                    <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"
                        size={18}
                    />
                    <input
                        type="text"
                        placeholder={t('admin.searchUnits')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-slate-100/50 border-none rounded-xl text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 w-72 transition-all placeholder:text-slate-400"
                    />
                </div>
                <Button
                    variant="primary"
                    size="md"
                    icon={<Building2 size={18} />}
                    onClick={() => setEditingUnit({})}
                >
                    {t('admin.addUnit')}
                </Button>
            </div>

            {/* Table */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('admin.unitName')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {t('admin.unitDesc')}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                            {t('common.actions')}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                    {filteredUnits.length > 0 ? (
                        filteredUnits.map((unit: Unit) => (
                            <tr
                                key={unit.id}
                                className="hover:bg-indigo-50/30 transition-all duration-200 group"
                            >
                                <td className="px-6 py-4">
                                    <span className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                        {unit.name}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-slate-500 leading-tight block max-w-sm">
                                        {unit.description || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<Pencil size={16} />}
                                            onClick={() => setEditingUnit(unit)}
                                            className="text-slate-400 hover:text-indigo-600"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<Trash2 size={16} />}
                                            onClick={() => {
                                                if (window.confirm(t('admin.deleteUnitConfirm'))) {
                                                    deleteUnitMutation.mutate(unit.id);
                                                }
                                            }}
                                            className="text-slate-400 hover:text-rose-600"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="px-6 py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Building2 size={48} className="text-slate-200" />
                                    <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                        {t('admin.noUnitsFound')}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </Card>
    );
};

export default UnitsTab;
