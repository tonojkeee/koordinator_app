/**
 * Design System - TabNavigation Component
 * 
 * Компонент навигации по вкладкам с поддержкой иконок, badge,
 * активного/неактивного состояния и горизонтальной прокрутки на мобильных устройствах.
 * 
 * @example
 * <TabNavigation
 *   tabs={[
 *     { id: 'all', label: 'Все', badge: 10 },
 *     { id: 'active', label: 'Активные', icon: <CheckIcon /> },
 *   ]}
 *   activeTab="all"
 *   onTabChange={(tabId) => console.log(tabId)}
 * />
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface TabNavigationProps {
  tabs: TabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
}

export const TabNavigation = React.memo<TabNavigationProps>(({
  tabs,
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 bg-surface-2 p-1 rounded-lg border border-border shadow-sm',
        // Horizontal scroll on mobile
        'overflow-x-auto no-scrollbar',
        // Snap scrolling for better mobile UX
        'snap-x snap-mandatory',
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300',
              'whitespace-nowrap snap-start min-w-fit flex items-center gap-2 relative',
              isActive
                ? 'bg-surface text-primary shadow-m3-1 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-3/50'
            )}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon && <span className={cn("transition-transform duration-300", isActive && "scale-110")}>{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center transition-colors duration-300',
                  isActive ? 'bg-primary text-white shadow-sm' : 'bg-border text-muted-foreground'
                )}
                aria-label={`${tab.badge} items`}
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
            {isActive && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full animate-fade-in" />
            )}
          </button>
        );
      })}
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';
