/**
 * Admin Module - Barrel Export
 */

// Main page component (new restructured version)
export { default as AdminPage } from './AdminPage';

// Legacy component (kept for backward compatibility and settings tabs)
export { default as AdminDashboard } from './AdminDashboard';

// Types
export * from './types';

// Hooks
export * from './hooks/useAdminQueries';

// Utils
export * from './utils';

// Components
export * from './components/tabs';
export * from './components/modals';
export { StatCard } from './components/StatCard';
