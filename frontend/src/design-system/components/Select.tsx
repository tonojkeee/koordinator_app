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
    <div className={cn('space-y-2', fullWidth && 'w-full group')}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1 opacity-70 transition-colors group-focus-within:text-primary"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary">
            {leftIcon}
          </div>
        )}

        <select
          id={selectId}
          className={cn(
            'w-full py-2.5 bg-surface border border-border rounded-xl appearance-none shadow-sm',
            'font-bold text-foreground text-sm tracking-tight',
            'transition-all outline-none cursor-pointer',
            'focus:border-primary focus:ring-2 focus:ring-primary/10',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/10',
            !error && 'hover:border-primary/30',
            leftIcon ? 'pl-11 pr-10' : 'px-4 pr-10',
            // Style for placeholder state
            !props.value && 'text-muted-foreground font-medium',
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
              className="text-foreground bg-surface font-bold"
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-transform duration-300 group-focus-within:rotate-180 group-focus-within:text-primary">
          <ChevronDown className="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

      {error && (
        <p className="text-[10px] font-black text-destructive uppercase tracking-widest px-1 animate-slide-up">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-[10px] text-muted-foreground font-bold px-1 opacity-60">{helperText}</p>
      )}
    </div>
  );
});


Select.displayName = 'Select';
