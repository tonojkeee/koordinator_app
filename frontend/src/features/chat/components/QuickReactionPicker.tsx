import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { getEmojiUrl } from '../../../utils/emoji';

// Popular quick reactions
const QUICK_REACTIONS = ['❤️', '🔥', '👍', '👎', '😁', '👏', '😮', '😢'];

interface QuickReactionPickerProps {
    messageId: number;
    triggerRef: React.RefObject<HTMLElement>;
    onReaction: (messageId: number, emoji: string) => void;
    onOpenFullPicker?: () => void;
    onClose: () => void;
    className?: string;
}

export const QuickReactionPicker: React.FC<QuickReactionPickerProps> = ({
    messageId,
    triggerRef,
    onReaction,
    onOpenFullPicker,
    onClose,
    className = ''
}) => {
    const [position, setPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null);
    const pickerElementRef = useRef<HTMLDivElement | null>(null);
    const isPositionCalculated = useRef(false);

    // Calculate position using ref callback - runs once when picker mounts
    const setPickerRef = useCallback((node: HTMLDivElement | null) => {
        pickerElementRef.current = node;

        if (node && triggerRef.current && !isPositionCalculated.current) {
            isPositionCalculated.current = true;

            const triggerRect = triggerRef.current.getBoundingClientRect();
            const pickerRect = node.getBoundingClientRect();

            const spaceAbove = triggerRect.top;
            const spaceBelow = window.innerHeight - triggerRect.bottom;
            const pickerHeight = pickerRect.height + 10; // + offset

            let top = 0;
            let placement: 'top' | 'bottom' = 'top';

            if (spaceAbove > pickerHeight) {
                top = triggerRect.top - pickerHeight;
                placement = 'top';
            } else if (spaceBelow > pickerHeight) {
                top = triggerRect.bottom + 10;
                placement = 'bottom';
            } else {
                // Fallback: Stick to top edge if no space
                top = 10;
            }

            // Center horizontally
            let left = triggerRect.left + (triggerRect.width / 2) - (pickerRect.width / 2);

            // Constrain to viewport width
            left = Math.max(10, Math.min(left, window.innerWidth - pickerRect.width - 10));

            setPosition({ top, left, placement });
        }
    }, [triggerRef]);

    // Close on click outside (document level)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerElementRef.current &&
                !pickerElementRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        // Use capture phase to ensure we catch clicks before other handlers might stop propagation
        document.addEventListener('mousedown', handleClickOutside, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [onClose, triggerRef]);

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

    if (!position) {
        // Render invisibly first to measure dimensions
        return createPortal(
            <div ref={setPickerRef} className="fixed top-[-9999px] left-[-9999px] opacity-0 pointer-events-none">
                <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-md shadow-lg border border-[#E0E0E0]">
                    {QUICK_REACTIONS.map((emoji) => (
                        <div key={emoji} className="w-8 h-8" />
                    ))}
                    {onOpenFullPicker && <div className="w-8 h-8" />}
                </div>
            </div>,
            document.body
        );
    }

    return createPortal(
        <div
            ref={setPickerRef}
            style={{
                top: position.top,
                left: position.left,
                position: 'fixed',
                zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
            className={`animate-in zoom-in-95 fade-in duration-150 ${className}`}
        >
            <div className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-md shadow-lg border border-[#E0E0E0]">
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={(e) => handleReaction(e, emoji)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-[#F5F5F5] hover:scale-110 active:scale-95 transition-all duration-150"
                        title={emoji}
                    >
                        <img
                            src={getEmojiUrl(emoji)}
                            alt={emoji}
                            className="w-6 h-6 object-contain pointer-events-none select-none"
                            loading="eager"
                        />
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
                            className="w-8 h-8 flex items-center justify-center rounded text-[#616161] hover:text-[#5B5FC7] hover:bg-[#F0F0F0] transition-all"
                            title="More reactions"
                        >
                            <Plus size={18} strokeWidth={1.5} />
                        </button>
                    </>
                )}
            </div>

            {/* Arrow pointer - optional, might be tricky with fixed positioning, simplified to just shadow for now or remove */}
        </div>,
        document.body
    );
};

export default QuickReactionPicker;
