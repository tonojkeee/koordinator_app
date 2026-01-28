/**
 * Design System - Header Component
 * 
 * Современный компонент заголовка страницы с минималистичным дизайном.
 * Основан на принципах современного UI/UX дизайна.
 * 
 * @example
 * <Header
 *   title="Электронная доска"
 *   subtitle="Документы"
 *   icon={<FileTextIcon />}
 *   iconColor="indigo"
 *   searchPlaceholder="Поиск документов..."
 *   searchValue={search}
 *   onSearchChange={(e) => setSearch(e.target.value)}
 *   tabs={[
 *     { id: 'all', label: 'Все', badge: 10 },
 *     { id: 'recent', label: 'Недавние' },
 *   ]}
 *   activeTab="all"
 *   onTabChange={setActiveTab}
 *   actions={
 *     <Button variant="primary" icon={<PlusIcon />}>
 *       Добавить
 *     </Button>
 *   }
 * />
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import { HeaderIcon, type HeaderIconColor } from './HeaderIcon';
import { SearchInput } from './SearchInput';
import { TabNavigation, type TabItem } from './TabNavigation';

export interface HeaderProps {
  /**
   * Основной заголовок модуля
   */
  title: string;
  
  /**
   * Подзаголовок (опционально)
   */
  subtitle?: React.ReactNode;

  /**
   * React элемент иконки модуля
   */
  icon: React.ReactNode;
  
  /**
   * Цветовая схема иконки
   * @default 'indigo'
   */
  iconColor?: HeaderIconColor;
  
  /**
   * Действия в правой части header (кнопки, меню и т.д.)
   */
  actions?: React.ReactNode;
  
  /**
   * Placeholder для поля поиска
   */
  searchPlaceholder?: string;
  
  /**
   * Значение поля поиска
   */
  searchValue?: string;
  
  /**
   * Обработчик изменения значения поиска
   */
  onSearchChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  /**
   * Обработчик очистки поля поиска
   */
  onSearchClear?: () => void;
  
  /**
   * Массив вкладок для нижнего уровня
   */
  tabs?: TabItem[];
  
  /**
   * ID активной вкладки
   */
  activeTab?: string;
  
  /**
   * Обработчик переключения вкладок
   */
  onTabChange?: (tabId: string) => void;
  
  /**
   * Дополнительные элементы в области табов (справа от табов)
   */
  tabsActions?: React.ReactNode;
  
  /**
   * Дополнительные CSS классы
   */
  className?: string;
  
  /**
   * Использовать sticky позиционирование
   * @default true
   */
  sticky?: boolean;
}

/**
 * Анимированный заголовок с fade-эффектом при изменении
 */
const AnimatedTitle: React.FC<{ title: string; className?: string }> = ({ title, className }) => {
  const [displayTitle, setDisplayTitle] = useState(title);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (title !== displayTitle) {
      // Using setTimeout to prevent synchronous state updates within the effect lifecycle
      // This is necessary to avoid React warnings about updates during render
      const timer = setTimeout(() => setIsAnimating(true), 0);
      
      // Fade out
      const fadeOutTimer = setTimeout(() => {
        setDisplayTitle(title);
        // Fade in
        const fadeInTimer = setTimeout(() => {
          setIsAnimating(false);
        }, 150);
        return () => clearTimeout(fadeInTimer);
      }, 150);
      
      return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
      };
    }
  }, [title, displayTitle]);

  // Синхронизируем displayTitle с title при первом рендере
  useEffect(() => {
    // Synchronize title with displayTitle on mount to ensure consistency
    const timer = setTimeout(() => setDisplayTitle(title), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <h1
      className={cn(
        'text-xl font-semibold text-[#242424] leading-tight truncate transition-all duration-300 ease-in-out',
        isAnimating && 'opacity-0 transform translate-y-1',
        !isAnimating && 'opacity-100 transform translate-y-0',
        className
      )}
    >
      {displayTitle}
    </h1>
  );
};

export const Header = React.memo<HeaderProps>(({
  title,
  subtitle,
  icon,
  iconColor = 'indigo',
  actions,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchClear,
  tabs,
  activeTab,
  onTabChange,
  tabsActions,
  className,
  sticky = true,
}) => {
  return (
    <header
      className={cn(
        // Outer container with precise Teams-like padding
        'px-6 py-4 z-40',
        sticky && 'sticky top-0 pointer-events-none',
        className
      )}
    >
      <div className={cn(
        // Refined Floating Surface: Using M3 Elevation and Teams-like hierarchy
        'bg-surface border border-border rounded-xl shadow-m3-1 p-3.5',
        'pointer-events-auto transition-shadow duration-300 hover:shadow-m3-2',
        'flex flex-col gap-3.5'
      )}>
        {/* Main Content: Icon + Title + Search + Actions */}
        <div className="flex items-center justify-between gap-6">
          {/* Left: Icon + Title Section */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Module Icon - Enhanced with subtle shadow */}
            <div className="shrink-0 shadow-sm rounded-lg overflow-hidden">
              <HeaderIcon icon={icon} color={iconColor} />
            </div>

            {/* Title Section */}
            <div className="min-w-0 flex flex-col justify-center">
              <AnimatedTitle title={title} className="text-lg font-black text-foreground tracking-tight" />
              {subtitle && (
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] leading-none mt-1 opacity-70">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          {/* Right: Search + Actions Section - Tighter grouping */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Search Input - Professional sizing */}
            {onSearchChange && (
              <div className="w-56 sm:w-72">
                <SearchInput
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={onSearchChange}
                  onClear={onSearchClear}
                  className="bg-surface-2 border-transparent focus:bg-surface focus:border-primary/30"
                />
              </div>
            )}

            {/* Actions - Unified spacing */}
            {actions && (
              <div className="flex items-center gap-2.5">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Optional Lower Level: Tab Navigation - More integrated look */}
        {((tabs && tabs.length > 0) || tabsActions) && (
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex-1 overflow-x-auto no-scrollbar">
              {tabs && tabs.length > 0 && (
                <TabNavigation
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                  className="bg-transparent border-none p-0 shadow-none"
                />
              )}
            </div>
            {tabsActions && (
              <div className="flex items-center pl-4 shrink-0">
                {tabsActions}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
});

Header.displayName = 'Header';
