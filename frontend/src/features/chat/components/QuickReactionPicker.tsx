import React, { useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

// Popular quick reactions
const QUICK_REACTIONS = ['❤️', '🔥', '👍', '👎', '😁', '👏', '😮', '😢'];

interface QuickReactionPickerProps {
    messageId: number;
    onReaction: (messageId: number, emoji: string) => void;
    onOpenFullPicker?: () => void;
    onClose: () => void;
    position?: 'top' | 'bottom';
    className?: string;
}

export const QuickReactionPicker: React.FC<QuickReactionPickerProps> = ({
    messageId,
    onReaction,
    onOpenFullPicker,
    onClose,
    position = 'top',
    className = ''
}) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    const isInitialClick = useRef(true);

    // Close on click outside (with delay to prevent immediate close on open click)
    useEffect(() => {
        // Reset initial click flag
        isInitialClick.current = true;

        const handleClickOutside = (event: MouseEvent) => {
            // Skip the first click (which is the button that opened the picker)
            if (isInitialClick.current) {
                isInitialClick.current = false;
                return;
            }

            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Add listener after a short delay to avoid catching the opening click
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleReaction = (e: React.MouseEvent, emoji: string) => {
        e.preventDefault();
        e.stopPropagation();
        onReaction(messageId, emoji);
        onClose();
    };

    return (
        <div
            ref={pickerRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className={`
                absolute z-[100] 
                ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
                left-1/2 -translate-x-1/2
                animate-in zoom-in-95 fade-in duration-150
                ${className}
            `}
        >
            <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-800/95 backdrop-blur-xl rounded-full shadow-xl shadow-black/30 border border-slate-700/50">
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={(e) => handleReaction(e, emoji)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 hover:scale-125 active:scale-95 transition-all duration-150"
                        title={emoji}
                    >
                        <span className="text-lg leading-none select-none">{emoji}</span>
                    </button>
                ))}

                {onOpenFullPicker && (
                    <>
                        <div className="w-px h-5 bg-slate-600/50 mx-1" />
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenFullPicker();
                                onClose();
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            title="More reactions"
                        >
                            <Plus size={18} />
                        </button>
                    </>
                )}
            </div>

            {/* Arrow pointer */}
            <div
                className={`
                    absolute left-1/2 -translate-x-1/2 w-0 h-0
                    border-l-[8px] border-l-transparent
                    border-r-[8px] border-r-transparent
                    ${position === 'top'
                        ? 'top-full border-t-[8px] border-t-slate-800/95'
                        : 'bottom-full border-b-[8px] border-b-slate-800/95'
                    }
                `}
            />
        </div>
    );
};

export default QuickReactionPicker;
