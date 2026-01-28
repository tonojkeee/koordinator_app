import React from 'react';
import { Tooltip } from '../components/Tooltip';
import { cn } from '../utils/cn';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <Tooltip content={label} position="right">
      <button
        onClick={onClick}
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 group focus:outline-none',
          isActive
            ? 'bg-blue-600/10 text-blue-600'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
          className
        )}
      >
        {/* Active Indicator Line */}
        {isActive && (
          <div className="absolute left-[-10px] w-1 h-8 bg-blue-600 rounded-r-full" />
        )}

        <div className={cn(
          'transition-transform duration-200',
          isActive ? 'scale-110' : 'group-hover:scale-110'
        )}>
          {icon}
        </div>
      </button>
    </Tooltip>
  );
};
