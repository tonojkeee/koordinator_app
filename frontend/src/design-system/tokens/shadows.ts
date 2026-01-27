/**
 * Design System - Shadow Tokens
 * 
 * Современная система теней для создания глубины и иерархии.
 * Основана на принципах Material Design с адаптацией под современные тренды.
 */

export const shadows = {
  // Elevation system - Flatter, subtle depth for Teams style
  elevation: {
    0: 'shadow-none',
    1: 'shadow-[0_2px_4px_rgba(0,0,0,0.04)]', // Very subtle
    2: 'shadow-[0_4px_8px_rgba(0,0,0,0.06)]', // Medium
    3: 'shadow-[0_8px_16px_rgba(0,0,0,0.08)]', // Large
    4: 'shadow-[0_12px_24px_rgba(0,0,0,0.1)]', // Extra large
    5: 'shadow-[0_20px_40px_rgba(0,0,0,0.12)]', // Maximum
  },

  // Colored shadows - specialized for Teams purple
  colored: {
    primary: 'shadow-lg shadow-teams-accent/10',
    success: 'shadow-lg shadow-emerald-500/10',
    warning: 'shadow-lg shadow-amber-500/10',
    danger: 'shadow-lg shadow-red-500/10',
    info: 'shadow-lg shadow-blue-500/10',
  },

  // Focus rings - Teams uses a distinct focus style
  focus: {
    primary: 'ring-2 ring-teams-accent/40 ring-offset-1',
    danger: 'ring-2 ring-red-500/40 ring-offset-1',
    success: 'ring-2 ring-emerald-500/40 ring-offset-1',
  },

  // Specific UI elements
  glass: 'shadow-glass backdrop-blur-xl',
  card: 'shadow-card border border-teams-border',
  cardHover: 'hover:shadow-elevation transition-shadow duration-200',
  button: {
    primary: 'shadow-sm',
    danger: 'shadow-sm',
  },
  modal: 'shadow-2xl shadow-black/10',
  selected: 'ring-2 ring-teams-accent/30',
} as const;

export type ShadowToken = typeof shadows;
