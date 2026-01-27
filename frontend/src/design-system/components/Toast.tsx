/**
 * Design System - Toast Component
 *
 * Компонент для отображения уведомлений с различными типами,
 * анимациями и поддержкой действий.
 *
 * @example
 * const { addToast } = useToast();
 *
 * addToast({
 *   type: 'success',
 *   title: 'Success',
 *   message: 'Operation completed',
 * });
 */

import React, { useState, useCallback } from 'react';
import { X, Trash2, MessageSquare, Bell } from 'lucide-react';
import { ToastContext, type Toast } from './ToastContext';
import { cn } from '../utils/cn';

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);

    const duration = toast.duration || 5000;
    if (duration !== Infinity) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  const iconMap = {
    info: <Bell size={18} />,
    success: <MessageSquare size={18} />,
    warning: <Bell size={18} />,
    error: <X size={18} />,
    deleted: <Trash2 size={18} />,
  };

  const bgColorMap = {
    info: 'bg-white border-[#E0E0E0] text-[#242424]',
    success: 'bg-white border-[#E0E0E0] text-[#242424]',
    warning: 'bg-white border-[#E0E0E0] text-[#242424]',
    error: 'bg-white border-[#E0E0E0] text-[#242424]',
    deleted: 'bg-white border-[#E0E0E0] text-[#242424]',
  };

  const iconColorMap = {
    info: 'text-[#5B5FC7]',
    success: 'text-[#237B4B]',
    warning: 'text-[#FFB900]',
    error: 'text-[#C4314B]',
    deleted: 'text-[#C4314B]',
  };

  const borderAccentMap = {
    info: 'border-l-[#5B5FC7]',
    success: 'border-l-[#237B4B]',
    warning: 'border-l-[#FFB900]',
    error: 'border-l-[#C4314B]',
    deleted: 'border-l-[#C4314B]',
  };

  return (
    <div
      className={cn(
        bgColorMap[toast.type],
        borderAccentMap[toast.type],
        'shadow-md border border-l-4',
        'rounded-md overflow-hidden transition-all duration-200 ease-in-out',
        isExiting ? 'opacity-0 translate-x-full' : 'animate-in slide-in-from-right-full fade-in',
        toast.onClick ? 'cursor-pointer hover:shadow-md' : '',
        'w-80 pointer-events-auto'
      )}
      style={isExiting ? { transitionDuration: '200ms' } : {}}
      onClick={(e) => {
        if (toast.onClick && !(e.target as HTMLElement).closest('button')) {
          toast.onClick();
          handleClose();
        }
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={cn('shrink-0 mt-0.5', iconColorMap[toast.type])}>
            {iconMap[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm leading-tight">{toast.title}</h4>
          {toast.message && (
            <p className="text-xs font-medium opacity-90 mt-1 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <div className="shrink-0 flex flex-col gap-2 -mt-1 -mr-1">
            <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-black/5 transition-colors opacity-60 hover:opacity-100"
            >
            <X size={14} />
            </button>
        </div>
      </div>
      {toast.action && (
          <div className="px-4 pb-3 pt-0 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.action?.onClick();
                  handleClose();
                }}
                className="text-xs font-bold uppercase tracking-wide hover:underline"
              >
                {toast.action.label}
              </button>
          </div>
      )}
    </div>
  );
};
