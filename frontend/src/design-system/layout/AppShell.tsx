import React from 'react';
import { PrimarySidebar } from './PrimarySidebar';

interface AppShellProps {
  children: React.ReactNode;
  secondaryNav?: React.ReactNode;
}

/**
 * AppShell is the main layout component that orchestrates the primary navigation,
 * optional secondary navigation, and the main content area.
 */
export const AppShell: React.FC<AppShellProps> = ({ children, secondaryNav }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Primary Navigation Sidebar - Fixed width (64px/w-16) */}
      <PrimarySidebar />

      {/* Secondary Navigation Sidebar - Optional slot for module-specific navigation */}
      {secondaryNav && (
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 bg-slate-50/50 overflow-y-auto">
          {secondaryNav}
        </aside>
      )}

      {/* Main Content Area - Flexible space */}
      <main className="flex-1 min-w-0 overflow-hidden relative bg-white">
        {children}
      </main>
    </div>
  );
};
