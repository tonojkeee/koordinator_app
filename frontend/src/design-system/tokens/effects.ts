/**
 * Design System - Effects Tokens
 * 
 * Современные визуальные эффекты для создания интерактивности и глубины.
 * Минималистичный подход без перегрузки интерфейса.
 */

export const effects = {
  // Transitions - Snappy Teams transitions
  transition: {
    fast: 'transition-all duration-150 ease-in-out',
    normal: 'transition-all duration-200 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-150 ease-in-out',
    transform: 'transition-transform duration-200 ease-in-out',
  },

  // Hover effects - subtle interactivity
  hover: {
    lift: 'hover:-translate-y-0.5 transition-transform duration-200 ease-out',
    scale: 'hover:scale-[1.02]',
    glow: 'hover:ring-2 hover:ring-teams-accent/20',
    brighten: 'hover:brightness-105',
  },

  // Active states
  active: {
    scale: 'active:scale-95',
    press: 'active:translate-y-0.5',
  },

  // Backdrop effects
  backdrop: {
    blur: 'backdrop-blur-md',
    overlay: 'bg-black/20',
  },

  // Border radius - Compact professional corners
  radius: {
    none: 'rounded-none',
    xs: 'rounded-sm', // 2px
    sm: 'rounded',    // 4px
    md: 'rounded-md', // 6px
    lg: 'rounded-lg', // 8px
    xl: 'rounded-xl', // 12px
    full: 'rounded-full',
  },

  // Standard animations
  animate: {
    fadeIn: 'animate-in fade-in duration-200',
    slideIn: 'animate-in slide-in-from-bottom-2 duration-300',
    scaleIn: 'animate-in zoom-in-98 duration-200',
    spin: 'animate-spin',
    pulse: 'animate-pulse',
  },
} as const;

export type EffectsToken = typeof effects;