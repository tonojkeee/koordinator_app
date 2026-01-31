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
          className="block text-sm font-medium text-foreground transition-opacity duration-[var(--duration-normal)] ease-[var(--easing-out)]"
        >
          {label}
        </label>
      )}

      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-[var(--duration-normal)] ease-[var(--easing-out)] group-focus-within:text-primary">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'w-full px-3 py-2.5 bg-surface border border-border rounded-[var(--radius)]',
            'font-normal text-foreground placeholder:text-muted-foreground/60 text-sm',
            'transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20',
            'hover:border-input shadow-subtle',
            error && 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-[var(--duration-normal)] ease-[var(--easing-out)] group-focus-within:text-primary">
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-semibold text-danger px-1 animate-slide-up">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-xs text-muted-foreground px-1 transition-opacity duration-[var(--duration-normal)] ease-[var(--easing-out)]">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
