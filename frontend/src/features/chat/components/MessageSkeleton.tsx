import React from 'react';

export const MessageSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-4 py-4 px-4">
        {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} items-start gap-3`}>
                {i % 2 === 0 && <div className="w-8 h-8 bg-[#F0F0F0] rounded-md shrink-0" />}
                <div className={`flex flex-col ${i % 2 === 0 ? 'items-start' : 'items-end'} max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-3 w-20 bg-[#F0F0F0] rounded" />
                        <div className="h-2 w-10 bg-[#F5F5F5] rounded" />
                    </div>
                    <div className={`h-10 bg-[#F0F0F0] rounded-md w-48 ${i % 2 === 0 ? 'rounded-tl-none' : 'rounded-tr-none'}`} />
                </div>
            </div>
        ))}
    </div>
);
