/**
 * Design System - Spacing Tokens
 * 
 * Современная система отступов основанная на 4px grid для идеального выравнивания.
 * Использует принципы 8-point grid system для согласованности.
 */

export const spacing = {
  // Padding - Compact, density-friendly system
  padding: {
    none: 'p-0',
    tight: 'p-1',   // 4px
    xs: 'p-2',      // 8px
    sm: 'p-3',      // 12px
    md: 'p-4',      // 16px
    lg: 'p-5',      // 20px
    xl: 'p-6',      // 24px
    '2xl': 'p-8',   // 32px
    '3xl': 'p-12',  // 48px
  },

  // Gap - for flexbox and grid
  gap: {
    none: 'gap-0',
    xs: 'gap-1',     // 4px
    sm: 'gap-2',     // 8px
    md: 'gap-3',     // 12px
    lg: 'gap-4',     // 16px
    xl: 'gap-6',     // 24px
    '2xl': 'gap-8',  // 32px
  },

  // Margin
  margin: {
    none: 'm-0',
    xs: 'm-1',       // 4px
    sm: 'm-2',       // 8px
    md: 'm-4',       // 16px
    lg: 'm-6',       // 24px
    xl: 'm-8',       // 32px
  },

  // Space - for stack layouts
  space: {
    xs: 'space-y-1',   // 4px
    sm: 'space-y-2',   // 8px
    md: 'space-y-3',   // 12px
    lg: 'space-y-4',   // 16px
    xl: 'space-y-6',   // 24px
  },

  // Container padding
  container: {
    mobile: 'px-3',    // 12px
    tablet: 'px-4',    // 16px
    desktop: 'px-6',   // 24px
  },
} as const;

export type SpacingToken = typeof spacing;
