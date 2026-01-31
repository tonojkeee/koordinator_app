import React from 'react';
import { cn } from '../../../design-system';

export const MessageSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-6 py-6 px-4">
        {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} items-end gap-3`}>
                {i % 2 === 0 && <div className="w-9 h-9 bg-[var(--surface-3)] rounded-lg shrink-0 shadow-subtle" />}
                <div className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'} max-w-[70%] w-full`}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-3 w-24 bg-[var(--surface-3)] rounded-lg" />
                        <div className="h-2 w-12 bg-[var(--surface-2)] rounded-lg opacity-50" />
                    </div>
                    <div className={cn(
                        "h-12 bg-[var(--surface-2)] rounded-lg w-full max-w-[320px] border border-[var(--border)]/50",
                        i % 2 === 0 ? 'rounded-bl-sm' : 'rounded-br-sm'
                    )} />
                </div>
            </div>
        ))}
    </div>
);
