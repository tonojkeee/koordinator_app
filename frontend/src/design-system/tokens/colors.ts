/**
 * Design System - Color Tokens
 * 
 * Современная цветовая палитра с улучшенным контрастом и читаемостью.
 * Основана на принципах Material Design 3 и современных UI трендах.
 */

export const colors = {
  // Microsoft Teams inspired palette
  teams: {
    purple: 'teams-accent',
    bg: 'teams-bg',
    sidebar: 'teams-sidebar',
    header: 'teams-header',
    border: 'teams-border',
    textPrimary: 'teams-text-primary',
    textSecondary: 'teams-text-secondary',
  },

  // Primary palette - now mapped to Teams purple
  primary: {
    25: 'primary-25',
    50: 'primary-50',
    100: 'primary-100',
    200: 'primary-200',
    300: 'primary-300',
    400: 'primary-400',
    500: 'primary-500', // #5B5FC7
    600: 'primary-600',
    700: 'primary-700',
    800: 'primary-800',
    900: 'primary-900',
    950: 'primary-950',
  },

  // Neutral palette - using slate for Teams-like gray scale
  neutral: {
    0: 'white',
    25: 'slate-25',
    50: 'slate-50',
    100: 'slate-100',
    200: 'slate-200',
    300: 'slate-300',
    400: 'slate-400',
    500: 'slate-500',
    600: 'slate-600',
    700: 'slate-700',
    800: 'slate-800',
    900: 'slate-900',
    950: 'slate-950',
  },

  // Surface colors for layering
  surface: {
    primary: 'white',
    secondary: 'teams-bg',
    tertiary: 'slate-100',
    elevated: 'white',
    overlay: 'black/20',
  },

  // Semantic colors
  success: {
    50: 'emerald-50',
    100: 'emerald-100',
    500: 'emerald-500',
    600: 'emerald-600',
    700: 'emerald-700',
  },
  warning: {
    50: 'amber-50',
    100: 'amber-100',
    500: 'amber-500',
    600: 'amber-600',
    700: 'amber-700',
  },
  danger: {
    50: 'red-50',
    100: 'red-100',
    500: 'red-500',
    600: 'red-600',
    700: 'red-700',
  },
  info: {
    50: 'blue-50',
    100: 'blue-100',
    500: 'blue-500',
    600: 'blue-600',
    700: 'blue-700',
  },
} as const;

export type ColorToken = typeof colors;
