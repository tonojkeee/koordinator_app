import React, { Fragment, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ContextMenuOption {
  label: string;
  icon?: React.ElementType;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'warning';
  divider?: boolean;
}

interface ContextMenuProps {
  children: React.ReactNode;
  options: ContextMenuOption[];
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ children, options, className }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let x = e.clientX;
    let y = e.clientY;
    
    const menuWidth = 224;
    const menuHeight = options.length * 36 + (options.filter(o => o.divider).length * 8) + 16;
    
    if (x + menuWidth > window.innerWidth) x = Math.max(10, x - menuWidth);
    if (y + menuHeight > window.innerHeight) y = Math.max(10, y - menuHeight);
    
    setPosition({ x, y });
    setIsOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => setIsOpen(false);
    const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    };
    
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div onContextMenu={handleContextMenu} className={cn("contents", className)}>
        {children}
      </div>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed z-[9999] pointer-events-auto" 
          style={{ top: position.y, left: position.x }}
        >
          <div className="w-56 bg-white rounded-md shadow-md border border-[#E0E0E0] py-1 focus:outline-none animate-in fade-in zoom-in-95 duration-100">
            {options.map((option, idx) => (
              <Fragment key={idx}>
                {option.divider && <div className="my-1 border-t border-[#E0E0E0]" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!option.disabled) {
                        option.onClick(e);
                        setIsOpen(false);
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={option.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all text-left mx-1 w-[calc(100%-8px)] rounded-md",
                    option.disabled ? "opacity-40 cursor-not-allowed" :
                    option.variant === 'danger' ? "text-[#C4314B] hover:bg-[#C4314B]/10" :
                    option.variant === 'warning' ? "text-amber-600 hover:bg-amber-50" :
                    "text-[#242424] hover:bg-[#F5F5F5] hover:text-[#5B5FC7] font-medium"
                  )}
                >
                  {option.icon && <option.icon size={16} className={cn(
                    "shrink-0",
                    option.disabled ? "text-[#BDBDBD]" :
                    option.variant === 'danger' ? "text-[#C4314B]" :
                    option.variant === 'warning' ? "text-amber-500" :
                    "text-[#616161] group-hover:text-[#5B5FC7]"
                  )} />}
                  <span className="truncate">{option.label}</span>
                </button>
              </Fragment>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
