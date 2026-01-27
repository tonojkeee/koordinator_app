/**
 * Design System - HeaderIcon Component
 * 
 * Вспомогательный компонент для отображения иконки модуля в Header.
 * Предоставляет обертку с цветным фоном, тенью и hover анимацией.
 * 
 * @example
 * <HeaderIcon icon={<MailIcon />} color="indigo" />
 * 
 * @example
 * <HeaderIcon icon={<FolderIcon />} color="amber" />
 * 
 * Requirements: 1.5, 1.6
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const headerIconVariants = cva(
  // Base styles - padding, rounded corners, shadow, hover animation
  'p-2 rounded-md transition-transform duration-300 hover:scale-105 text-white',
  {
    variants: {
      color: {
        indigo: 'bg-[#5B5FC7]',
        amber: 'bg-[#D97706]',
        rose: 'bg-[#C4314B]',
        green: 'bg-[#16A34A]',
        blue: 'bg-[#2563EB]',
      },
    },
    defaultVariants: {
      color: 'indigo',
    },
  }
);

export type HeaderIconColor = 'indigo' | 'amber' | 'rose' | 'green' | 'blue';

export interface HeaderIconProps extends VariantProps<typeof headerIconVariants> {
  /**
   * React элемент иконки (обычно из lucide-react)
   */
  icon: React.ReactNode;
  
  /**
   * Цветовая схема иконки
   * @default 'indigo'
   */
  color?: HeaderIconColor;
  
  /**
   * Дополнительные CSS классы
   */
  className?: string;
}

export const HeaderIcon = React.memo<HeaderIconProps>(({
  icon,
  color = 'indigo',
  className,
}) => {
  return (
    <div
      className={cn(headerIconVariants({ color }), className)}
      aria-hidden="true"
    >
      {icon}
    </div>
  );
});

HeaderIcon.displayName = 'HeaderIcon';
