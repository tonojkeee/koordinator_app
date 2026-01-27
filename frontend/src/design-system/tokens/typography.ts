/**
 * Design System - Typography Tokens
 * 
 * Современная типографическая система с четкой иерархией и улучшенной читаемостью.
 * Основана на принципах современного веб-дизайна.
 */

export const typography = {
  // Font Family
  fontFamily: 'font-sans',

  // Display - for large headers
  display: {
    large: 'text-3xl font-bold text-teams-text-primary leading-tight tracking-tight',
    medium: 'text-2xl font-bold text-teams-text-primary leading-tight tracking-tight',
    small: 'text-xl font-bold text-teams-text-primary leading-tight tracking-tight',
  },

  // Headings - Semibold for Teams feel
  heading: {
    h1: 'text-xl font-semibold text-teams-text-primary leading-snug',
    h2: 'text-lg font-semibold text-teams-text-primary leading-snug',
    h3: 'text-base font-semibold text-teams-text-primary leading-snug',
    h4: 'text-sm font-semibold text-teams-text-primary leading-snug',
    h5: 'text-xs font-bold text-teams-text-primary uppercase tracking-wider',
    h6: 'text-[10px] font-bold text-teams-text-primary uppercase tracking-widest',
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
