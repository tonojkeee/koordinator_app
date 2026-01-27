/**
 * Design System - Select Component
 * 
 * Компонент выпадающего списка с единым стилем,
 * соответствующим дизайн-системе.
 * 
 * @example
 * <Select
 *   label="Country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' }
 *   ]}
 * />
 * 
 * @example
 * <Select
 *   label="Priority"
 *   error="Priority is required"
 *   placeholder="Select priority"
 * />
 */

import React from 'react';
import { cn } from '../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
}

export const Select = React.memo<SelectProps>(({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  fullWidth,
  leftIcon,
  className,
  id,
  ...props
}) => {
  // Generate unique ID if not provided
  const generatedId = React.useId();
  const selectId = id || generatedId;

  return (
    <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-bold text-[#242424]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161] pointer-events-none">
            {leftIcon}
          </div>
        )}

        <select
          id={selectId}
          className={cn(
            'w-full py-2 bg-white border border-[#E0E0E0] rounded-md appearance-none',
            'font-medium text-[#242424] text-sm',
            'transition-all outline-none cursor-pointer',
            'focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7]',
            error && 'border-[#C4314B] focus:border-[#C4314B] focus:ring-[#C4314B]/20',
            !error && 'hover:border-[#BDBDBD]',
            leftIcon ? 'pl-9 pr-10' : 'px-3 pr-10',
            // Style for placeholder state
            !props.value && 'text-[#616161]',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="text-[#242424]"
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161] pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-[#C4314B]">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-[#616161]">{helperText}</p>
      )}
    </div>
  );
});


Select.displayName = 'Select';
