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
  // Base styles - современный минималистичный подход
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-[#5B5FC7] hover:bg-[#4f52b2] text-white shadow-sm hover:shadow focus:ring-[#5B5FC7]/20 active:scale-[0.98]',
        secondary: 'bg-white hover:bg-[#F5F5F5] text-[#242424] border border-[#E0E0E0] hover:border-[#BDBDBD] shadow-sm hover:shadow focus:ring-[#5B5FC7]/20 active:scale-[0.98]',
        danger: 'bg-[#C4314B] hover:bg-[#a3283e] text-white shadow-sm hover:shadow focus:ring-[#C4314B]/20 active:scale-[0.98]',
        ghost: 'hover:bg-[#EBEBEB] text-[#424242] hover:text-[#242424] focus:ring-[#5B5FC7]/20 active:scale-[0.98]',
        outline: 'border border-[#E0E0E0] hover:border-[#BDBDBD] text-[#242424] hover:bg-[#F5F5F5] focus:ring-[#5B5FC7]/20 active:scale-[0.98]',
      },
      size: {
        sm: 'px-3 h-8 text-xs font-semibold rounded-md',
        md: 'px-4 h-9 text-sm font-semibold rounded-md',
        lg: 'px-6 h-11 text-base font-semibold rounded-md',
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
