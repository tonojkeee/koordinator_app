/**
 * Design System - Button Component
 * 
 * Современный компонент кнопки с минималистичным дизайном и четкой иерархией.
 * Основан на принципах современного UI/UX дизайна.
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * @example
 * <Button variant="danger" icon={<TrashIcon />} loading>
 *   Delete
 * </Button>
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius)] transition-all duration-[var(--duration-normal)] ease-[var(--easing-out)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 overflow-hidden relative active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-subtle shadow-subtle-hover hover:bg-teams-brandHover',
        secondary: 'bg-secondary text-secondary-foreground border border-border hover:bg-surface-3 hover:border-border/80',
        danger: 'bg-destructive text-destructive-foreground shadow-subtle shadow-subtle-hover hover:bg-destructive/90',
        ghost: 'bg-transparent text-foreground hover:bg-surface-2',
        outline: 'border border-border bg-transparent text-foreground hover:bg-surface-1 hover:border-teams-brand/30 hover:text-teams-brand',
        link: 'text-teams-brand underline-offset-4 hover:underline px-0 h-auto'
      },
      size: {
        sm: 'px-3 h-8 text-xs',
        md: 'px-4 h-10 text-sm',
        lg: 'px-6 h-12 text-base',
        icon: 'h-10 w-10 p-0 rounded-full'
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.memo<ButtonProps>(({
  variant,
  size,
  icon,
  iconPosition = 'left',
  loading,
  fullWidth,
  children,
  className,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && 'w-full',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
});

Button.displayName = 'Button';
