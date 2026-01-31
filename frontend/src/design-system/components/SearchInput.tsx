/**
 * Design System - SearchInput Component
 * 
 * Компонент поиска с иконкой, glass effect фоном и кнопкой очистки.
 * Используется в Header компонентах для быстрого поиска.
 * 
 * @example
 * <SearchInput
 *   placeholder="Поиск документов..."
 *   value={searchValue}
 *   onChange={(e) => setSearchValue(e.target.value)}
 *   onClear={() => setSearchValue('')}
 * />
 * 
 * Requirements: 3.1-3.5, 16.2
 */

import React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /**
   * Callback вызываемый при нажатии на кнопку очистки
   */
  onClear?: () => void;
}

export const SearchInput = React.memo<SearchInputProps>(({
  value,
  onChange,
  onClear,
  placeholder,
  className,
  ...props
}) => {
  const { t } = useTranslation();
  const defaultPlaceholder = t('common.search_placeholder');

  return (
    <div className={cn('relative group w-full sm:w-80', className)}>
      {/* Search Icon - абсолютное позиционирование слева */}
      <Search
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
          'text-muted-foreground transition-colors',
          'group-focus-within:text-primary'
        )}
      />

      {/* Input Field с glass effect */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder || defaultPlaceholder}
        className={cn(
          // Base styling - responsive width (Requirements 11.2)
          'w-full h-9 pl-9 pr-8',
          // Teams-like background
          'bg-surface border border-border rounded-md',
          // Typography
          'text-sm font-normal text-foreground placeholder:text-muted-foreground',
          // Transitions
          'transition-all outline-none',
          // Focus state enhancement (Requirement 3.3)
          'focus:border-primary focus:ring-1 focus:ring-ring'
        )}
        {...props}
      />

      {/* Clear Button - показывается только при наличии значения */}
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2',
            'p-0.5 hover:bg-surface-2 rounded-full transition-colors'
          )}
          aria-label="Clear search"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
});

SearchInput.displayName = 'SearchInput';
