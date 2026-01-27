/**
 * Design System - TextArea Component
 * 
 * Компонент многострочного поля ввода, расширяющий стилизацию Input
 * для текстовых областей.
 * 
 * @example
 * <TextArea
 *   label="Description"
 *   placeholder="Enter description"
 *   rows={4}
 * />
 * 
 * @example
 * <TextArea
 *   label="Comments"
 *   error="Comment is required"
 *   helperText="Maximum 500 characters"
 * />
 */

import React from 'react';
import { cn } from '../utils/cn';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const TextArea = React.memo<TextAreaProps>(({
  label,
  error,
  helperText,
  fullWidth,
  className,
  id,
  rows = 4,
  ...props
}) => {
  // Generate unique ID if not provided
  const generatedId = React.useId();
  const textareaId = id || generatedId;

  return (
    <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-xs font-bold text-slate-700"
        >
          {label}
        </label>
      )}
      
      <textarea
        id={textareaId}
        rows={rows}
        className={cn(
          'w-full px-3 py-2 bg-white border border-[#E0E0E0] rounded-md',
          'font-normal text-[#242424] placeholder:text-[#888888] text-sm',
          'transition-all outline-none resize-y',
          'focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7]',
          'hover:border-[#888888]',
          error && 'border-[#C4314B] focus:border-[#C4314B] focus:ring-[#C4314B]/20',
          !error && 'border-[#E0E0E0]',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';
