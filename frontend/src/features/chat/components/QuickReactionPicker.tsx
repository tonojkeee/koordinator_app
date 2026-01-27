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
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-md shadow-lg border border-[#E0E0E0]">
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={(e) => handleReaction(e, emoji)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#F5F5F5] hover:scale-110 active:scale-95 transition-all duration-150"
                        title={emoji}
                    >
                        <span className="text-lg leading-none select-none">{emoji}</span>
                    </button>
                ))}

                {onOpenFullPicker && (
                    <>
                        <div className="w-px h-5 bg-[#E0E0E0] mx-1" />
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onOpenFullPicker();
                                onClose();
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded text-[#616161] hover:text-[#5B5FC7] hover:bg-[#F0F0F0] transition-all"
                            title="More reactions"
                        >
                            <Plus size={16} strokeWidth={1.5} />
                        </button>
                    </>
                )}
            </div>

            {/* Arrow pointer */}
            <div
                className={`
                    absolute left-1/2 -translate-x-1/2 w-0 h-0
                    border-l-[6px] border-l-transparent
                    border-r-[6px] border-r-transparent
                    ${position === 'top'
                        ? 'top-full border-t-[6px] border-t-white drop-shadow-sm'
                        : 'bottom-full border-b-[6px] border-b-white drop-shadow-sm'
                    }
                `}
            />
        </div>
    );
};

export default QuickReactionPicker;
