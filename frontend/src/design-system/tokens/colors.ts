/**
 * Design System - Color Tokens
 *
 * Modern color palette with improved contrast and readability.
 * Based on WCAG 2.1 AA accessibility guidelines (4.5:1 minimum contrast).
 *
 * COLOR HIERARCHY (6 Semantic Levels):
 * - primary: Main CTAs/active elements (Corporate blue #0066CC base)
 * - secondary: Headers/labels (Dark gray for strong readability)
 * - tertiary: Metadata/captions (Medium gray, WCAG AA compliant)
 * - success: Completed states (Emerald green)
 * - warning: Pending tasks (Amber/yellow)
 * - danger: Errors/destructive actions (Red)
 *
 * All colors are defined in CSS variables in index.css for runtime theming.
 */

export const colors = {
  // Teams signature colors (Legacy support)
  teams: {
    purple: 'teams-accent',
    bg: 'teams-bg',
    sidebar: 'teams-sidebar',
    header: 'teams-header',
    border: 'teams-border',
    textPrimary: 'teams-text-primary',
    textSecondary: 'teams-text-secondary',
  },

  // Primary palette - Corporate blue #0066CC (refined saturation)
  primary: {
    25: 'primary-25',
    50: 'primary-50',
    100: 'primary-100',
    200: 'primary-200',
    300: 'primary-300',
    400: 'primary-400',
    500: 'primary-500', // #0066CC base
    600: 'primary-600',
    700: 'primary-700',
    800: 'primary-800',
    900: 'primary-900',
    950: 'primary-950',
  },

  // Neutral palette - Slate gray scale for Team-like appearance
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

  // Surface colors for layering hierarchy
  surface: {
    primary: 'white',
    secondary: 'teams-bg',
    tertiary: 'slate-100',
    elevated: 'white',
    overlay: 'black/20',
  },

  // Semantic Colors - 6-Level Hierarchy
  // All semantic colors must use CSS variables from index.css
  // Usage guidelines:
  // - primary: Main CTAs, active states, primary actions
  // - secondary: Page headers, section labels, important text
  // - tertiary: Metadata, captions, timestamps, secondary information
  // - success: Completed tasks, success messages, positive states
  // - warning: Pending actions, alerts, cautionary states
  // - danger: Error messages, destructive actions, critical alerts

  semantic: {
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    tertiary: 'var(--tertiary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
  },

  // Semantic color palettes (for gradients, hover states, variants)
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
} as const;

export type ColorToken = typeof colors;
