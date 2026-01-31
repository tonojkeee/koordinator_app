import React from 'react';
import { Tooltip } from '../components/Tooltip';
import { cn } from '../utils/cn';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  badge?: number;
  warningBadge?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive = false,
  onClick,
  className,
  badge,
  warningBadge,
}) => {
  return (
    <Tooltip content={label} position="right">
      <button
        onClick={onClick}
        className={cn(
          'relative flex items-center justify-center w-12 h-12 rounded-[8px] transition-all duration-[150ms] ease-[cubic-bezier(0.4,0,0.2,1)] group focus:outline-none',
          isActive
            ? 'bg-primary/10 text-primary shadow-sm'
            : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
          className
        )}
      >
        {/* Active Indicator Line */}
        {isActive && (
          <div className="absolute left-[-12px] w-1.5 h-6 bg-primary rounded-r-full" />
        )}

        <div className={cn(
          'transition-transform duration-[150ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          isActive ? 'scale-110' : 'group-hover:scale-110'
        )}>
          {icon}
        </div>

        {/* Badges */}
        {badge !== undefined && badge > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-danger text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm border-2 border-background animate-scale-in">
            {badge > 99 ? '99+' : badge}
          </div>
        )}

        {warningBadge !== undefined && warningBadge > 0 && (
          <div className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] bg-warning text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm border-2 border-background animate-scale-in">
            {warningBadge > 99 ? '99+' : warningBadge}
          </div>
        )}
      </button>
    </Tooltip>
  );
};
