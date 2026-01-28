import React from 'react';

interface SecondarySidebarProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * SecondarySidebar (Context Panel)
 * Sits between the primary rail and the main content.
 * Displays context-specific lists (e.g., list of chats, email folders).
 */
export const SecondarySidebar: React.FC<SecondarySidebarProps> = ({
  title,
  children,
  actions
}) => {
  return (
    <aside className="flex flex-col w-64 h-full border-r border-border bg-surface-1 flex-shrink-0 overflow-hidden">
      {/* Header Area */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-border/50 shrink-0">
        <h2 className="text-base font-semibold truncate text-foreground">
          {title}
        </h2>
        {actions && (
          <div className="flex items-center gap-1">
            {actions}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="py-2">
          {children}
        </div>
      </div>
    </aside>
  );
};
