/**
 * Design System - Typography Tokens
 * 
 * Современная типографическая система с четкой иерархией и улучшенной читаемостью.
 * Основана на принципах современного веб-дизайна.
 */

export const typography = {
  // Font Family
  fontFamily: 'font-sans',

  // Display - for large headers (supplementary to 6-level heading system)
  display: {
    large: 'text-3xl font-bold text-teams-text-primary leading-tight tracking-tight',
    medium: 'text-2xl font-bold text-teams-text-primary leading-tight tracking-tight',
    small: 'text-xl font-bold text-teams-text-primary leading-tight tracking-tight',
  },

  heading: {
    h1: 'text-[2rem] font-bold text-teams-text-primary leading-tight tracking-tight',
    h2: 'text-[1.75rem] font-semibold text-teams-text-primary leading-tight tracking-tight',
    h3: 'text-[1.5rem] font-semibold text-teams-text-primary leading-tight tracking-tight',
    h4: 'text-[1.25rem] font-semibold text-teams-text-primary leading-snug tracking-wide',
    h5: 'text-[0.875rem] font-bold text-teams-text-primary leading-snug tracking-wide',
    h6: 'text-[0.75rem] font-bold text-teams-text-primary leading-snug tracking-wide',
  },

  // Body text - Professional and dense
  body: {
    large: 'text-base font-normal text-teams-text-primary leading-normal',
    medium: 'text-sm font-normal text-teams-text-primary leading-normal',
    small: 'text-xs font-normal text-teams-text-secondary leading-normal',
  },

  // UI Elements
  label: {
    large: 'text-sm font-medium text-teams-text-primary',
    medium: 'text-xs font-medium text-teams-text-primary',
    small: 'text-[11px] font-medium text-teams-text-secondary',
  },

  // Captions
  caption: {
    large: 'text-xs font-normal text-teams-text-secondary',
    medium: 'text-[11px] font-normal text-teams-text-secondary',
    small: 'text-[10px] font-normal text-teams-text-secondary/80',
  },

  // Special styles
  overline: 'text-[10px] font-bold text-teams-text-secondary uppercase tracking-widest',
} as const;

export type TypographyToken = typeof typography;
