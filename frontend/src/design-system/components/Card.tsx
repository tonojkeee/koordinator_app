/**
 * Design System - Card Component
 * 
 * Современный компонент карточки с минималистичным дизайном и четкой иерархией.
 * Основан на принципах современного UI/UX дизайна.
 * 
 * @example
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </Card>
 * 
 * @example
 * <Card selected hoverable padding="lg">
 *   Selected card with hover effect
 * </Card>
 */

import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../utils/cn';

const cardVariants = cva(
  // Base styles - Teams-like
  'bg-white border rounded-md transition-all duration-200 ease-out',
  {
    variants: {
      selected: {
        true: 'bg-[#F0F0F0] border-[#5B5FC7] ring-1 ring-[#5B5FC7]',
        false: 'border-[#E0E0E0] hover:border-[#BDBDBD]',
      },
      hoverable: {
        true: 'cursor-pointer hover:shadow-sm active:scale-[0.99]',
        false: '',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      variant: {
        default: 'shadow-none',
        elevated: 'shadow-sm',
        outlined: 'border',
        ghost: 'border-0 shadow-none bg-transparent',
      },
    },
    defaultVariants: {
      selected: false,
      hoverable: true,
      padding: 'md',
      variant: 'default',
    },
  }
);

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost';
}

export const Card = React.memo<CardProps>(({
  selected,
  hoverable,
  padding,
  variant,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        cardVariants({ selected, hoverable, padding, variant }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
