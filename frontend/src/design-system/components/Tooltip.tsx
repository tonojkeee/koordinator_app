import { useState, useRef, useEffect, forwardRef, type PropsWithChildren } from 'react';

export interface TooltipProps extends PropsWithChildren {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(({
  children,
  content,
  position = 'top',
  className = ''
// eslint-disable-next-line @typescript-eslint/no-unused-vars
}, _ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'top-1/2 left-full ml-2 transform -translate-y-1/2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'top-1/2 right-full mr-2 transform -translate-y-1/2'
  };

  return (
    <span
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className="relative inline-block"
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg shadow-sm
            ${positionClasses[position]}
            ${className}
          `}
        >
          {content}
          <div className={`
            absolute w-0 h-0 border-8 border-transparent
            ${position === 'top' ? 'top-full left-1/2 -ml-4 border-t-slate-800' : ''}
            ${position === 'right' ? 'top-1/2 left-0 -mt-4 border-r-slate-800' : ''}
            ${position === 'bottom' ? 'top-0 left-1/2 -ml-4 border-b-slate-800' : ''}
            ${position === 'left' ? 'top-1/2 right-0 -mt-4 border-l-slate-800' : ''}
          `}></div>
        </div>
      )}
    </span>
  );
});

Tooltip.displayName = 'Tooltip';