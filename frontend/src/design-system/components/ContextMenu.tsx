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
  onClick: () => void;
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
          <div className="w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 py-1.5 focus:outline-none ring-1 ring-black/5 animate-in fade-in zoom-in duration-100">
            {options.map((option, idx) => (
              <Fragment key={idx}>
                {option.divider && <div className="my-1 border-t border-slate-100" />}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!option.disabled) {
                        option.onClick();
                        setIsOpen(false);
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={option.disabled}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm transition-all text-left mx-1.5 w-[calc(100%-12px)] rounded-md",
                    option.disabled ? "opacity-30 cursor-not-allowed" : 
                    option.variant === 'danger' ? "text-rose-600 hover:bg-rose-50" : 
                    option.variant === 'warning' ? "text-amber-600 hover:bg-amber-50" :
                    "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium"
                  )}
                >
                  {option.icon && <option.icon size={16} className={cn(
                    "shrink-0",
                    option.disabled ? "text-slate-300" :
                    option.variant === 'danger' ? "text-rose-500" : 
                    option.variant === 'warning' ? "text-amber-500" :
                    "text-slate-400 group-hover:text-indigo-500"
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
