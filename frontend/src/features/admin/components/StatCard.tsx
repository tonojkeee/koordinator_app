import React from 'react';
import type { TFunction } from 'i18next';
import { cn } from '../../../design-system';

interface StatCardProps {
    title: string;
    value: string | number;
    subValue?: string | number;
    icon: React.ReactNode;
    color: 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose';
    trend?: string;
    isLive?: boolean;
    t: TFunction;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subValue,
    icon,
    color,
    trend,
    isLive,
    t
}) => {
    const colorStyles = {
        indigo: 'bg-primary/10 border-primary/20 text-primary',
        emerald: 'bg-green-500/10 border-green-500/20 text-green-700',
        violet: 'bg-purple-500/10 border-purple-500/20 text-purple-700',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-700',
        rose: 'bg-destructive/10 border-destructive/20 text-destructive',
    };

    const selectedColor = colorStyles[color];

    return (
        <div
            className="group relative bg-surface border border-border p-6 overflow-hidden flex flex-col justify-between h-36"
            style={{
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-subtle)',
                transitionDuration: 'var(--duration-normal)',
                transitionTimingFunction: 'var(--easing-out)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-subtle)';
            }}
        >
            {/* Background Accent */}
            <div className={cn("absolute inset-0 opacity-0 transition-opacity group-hover:opacity-[0.03]", selectedColor.split(' ')[0])} />

            <div className="flex justify-between items-start relative z-10">
                <div
                    className={cn("p-3 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", selectedColor)}
                    style={{ borderRadius: 'var(--radius)' }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-medium)'}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-subtle)'}
                >
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <div className="w-5 h-5">{React.cloneElement(icon as React.ReactElement<any>, { strokeWidth: 2.5 } as any)}</div>
                </div>
                {trend && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black px-3 py-1 bg-surface-2 text-foreground rounded-full border border-border shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300 uppercase tracking-widest">
                            {trend}
                        </span>
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <div className="flex items-end justify-between gap-2 overflow-hidden">
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors duration-300">
                                {value}
                            </span>
                            {isLive && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-700 rounded-lg border border-green-500/20 animate-pulse shrink-0 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t('common.online')}</span>
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary/70 transition-colors mt-1.5 truncate opacity-70">
                            {title}
                        </span>
                    </div>
                    {subValue && (
                        <div className="text-right shrink-0 pb-1">
                            <span className="text-[10px] font-black text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest opacity-50 tabular-nums">
                                {subValue}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
