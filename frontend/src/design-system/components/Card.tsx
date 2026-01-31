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
  // Base styles - Teams/Material 3 Hybrid
  'bg-card text-card-foreground border border-border rounded-lg transition-all duration-300 ease-in-out',
  {
    variants: {
      selected: {
        true: 'ring-2 ring-primary border-transparent bg-primary/5 [box-shadow:var(--shadow-strong)]',
        false: '',
      },
      hoverable: {
        true: 'cursor-pointer hover:[box-shadow:var(--shadow-medium)] hover:bg-surface-1 active:scale-[0.99]',
        false: '',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-5',
        lg: 'p-7',
        xl: 'p-10',
      },
      variant: {
        default: '[box-shadow:var(--shadow-subtle)] hover:[box-shadow:var(--shadow-medium)]',
        elevated: '[box-shadow:var(--shadow-medium)] border-transparent hover:[box-shadow:var(--shadow-strong)]',
        outlined: 'border border-border bg-transparent shadow-none',
        ghost: 'border-0 shadow-none bg-transparent',
      },
    },
    defaultVariants: {
      selected: false,
      hoverable: false,
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
