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
  subtitle?: string;
  
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
        // Outer container for floating effect
        'px-6 pt-4 pb-2 z-40',
        sticky && 'sticky top-0 pointer-events-none',
        className
      )}
    >
      <div className={cn(
        // Floating card style
        'bg-white border border-[#E0E0E0] rounded-lg shadow-sm p-3',
        'pointer-events-auto', // Re-enable pointer events
        'flex flex-col gap-3'
      )}>
        {/* Upper Level: Icon + Title + Search + Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Icon + Title Section */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Module Icon */}
            <HeaderIcon icon={icon} color={iconColor} className="rounded-md shadow-sm" />

            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <AnimatedTitle title={title} className="text-base font-bold text-[#242424]" />
              {subtitle && (
                <div className="text-[10px] font-semibold text-[#888888] uppercase tracking-wider leading-tight">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {/* Search Input */}
            {onSearchChange && (
              <div className="w-full sm:w-64">
                <SearchInput
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={onSearchChange}
                  onClear={onSearchClear}
                />
              </div>
            )}

            {/* Actions */}
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Lower Level: Tab Navigation */}
        {((tabs && tabs.length > 0) || tabsActions) && (
          <div className="flex items-center justify-between pt-1 border-t border-[#F0F0F0] mt-1 pt-2">
            <div className="flex-1 overflow-x-auto">
              {tabs && tabs.length > 0 && (
                <TabNavigation
                  tabs={tabs}
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                />
              )}
            </div>
            {tabsActions && (
              <div className="flex items-center pl-2 shrink-0">
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
