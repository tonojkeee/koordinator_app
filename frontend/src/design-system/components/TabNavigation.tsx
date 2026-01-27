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
        'flex gap-1',
        // Horizontal scroll on mobile
        'overflow-x-auto scrollbar-hide',
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
              'flex items-center gap-2 px-3 py-2 rounded-t-md text-sm font-semibold transition-all',
              'whitespace-nowrap snap-start min-w-fit border-b-2',
              isActive
                ? 'text-[#5B5FC7] border-[#5B5FC7] bg-[#F0F0F0]'
                : 'text-[#616161] border-transparent hover:text-[#242424] hover:bg-[#F5F5F5]'
            )}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-[#5B5FC7] text-white' : 'bg-[#E0E0E0] text-[#616161]'
                )}
                aria-label={`${tab.badge} items`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

TabNavigation.displayName = 'TabNavigation';
