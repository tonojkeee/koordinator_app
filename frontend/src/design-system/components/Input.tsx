/**
 * Design System - Input Component
 * 
 * Современный компонент поля ввода с минималистичным дизайном и четкой иерархией.
 * Основан на принципах современного UI/UX дизайна.
 * 
 * @example
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   type="email"
 *   leftIcon={<MailIcon />}
 * />
 * 
 * @example
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password is required"
 * />
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.memo<InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth,
  className,
  id,
  ...props
}) => {
  // Generate unique ID if not provided
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#242424]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161]">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'w-full px-3 py-2 bg-white border border-[#E0E0E0] rounded-md',
            'font-normal text-[#242424] placeholder:text-[#616161] text-sm',
            'transition-all duration-200 ease-out outline-none',
            'focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7]',
            'hover:border-[#BDBDBD]',
            error && 'border-[#C4314B] focus:border-[#C4314B] focus:ring-[#C4314B]/20',
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161]">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm font-medium text-[#C4314B]">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-[#616161]">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
