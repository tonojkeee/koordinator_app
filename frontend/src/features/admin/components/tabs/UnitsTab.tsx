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
        <Card
            variant="default"
            padding="none"
            hoverable={false}
            className="overflow-hidden animate-fade-in border-border/60"
            style={{
                boxShadow: 'var(--shadow-subtle)'
            }}
        >
            {/* Header */}
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
                        placeholder={t('admin.searchUnits')}
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
                <Button
                    variant="primary"
                    size="md"
                    icon={<Building2 size={18} strokeWidth={2.5} />}
                    onClick={() => setEditingUnit({})}
                    className="font-black uppercase tracking-widest text-xs px-6 scale-105"
                    style={{
                        boxShadow: 'var(--shadow-medium)'
                    }}
                >
                    {t('admin.addUnit')}
                </Button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-2/80 border-b border-border">
                            <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                                {t('admin.unitName')}
                            </th>
                            <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">
                                {t('admin.unitDesc')}
                            </th>
                            <th className="px-8 py-5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] text-right">
                                {t('common.actions')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {filteredUnits.length > 0 ? (
                            filteredUnits.map((unit: Unit) => (
                                <tr
                                    key={unit.id}
                                    className="hover:bg-primary/5 group active:bg-primary/10"
                                    style={{
                                        transitionDuration: 'var(--duration-normal)',
                                        transitionTimingFunction: 'var(--easing-out)'
                                    }}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-primary border border-border group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                <Building2 size={16} strokeWidth={2.5} />
                                            </div>
                                            <span className="font-black text-foreground text-sm group-hover:text-primary transition-colors tracking-tight">
                                                {unit.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs text-muted-foreground font-bold leading-relaxed block max-w-md opacity-80 group-hover:opacity-100 transition-opacity">
                                            {unit.description || '-'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingUnit(unit)}
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
                                                    if (window.confirm(t('admin.deleteUnitConfirm'))) {
                                                        deleteUnitMutation.mutate(unit.id);
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="px-8 py-20 text-center animate-scale-in">
                                    <div className="flex flex-col items-center gap-4">
                                        <div
                                            className="w-20 h-20 bg-surface-2 flex items-center justify-center"
                                            style={{ borderRadius: '100%', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)' }}
                                        >
                                            <Building2 size={48} className="text-muted-foreground/20" strokeWidth={1} />
                                        </div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50">
                                            {t('admin.noUnitsFound')}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default UnitsTab;
