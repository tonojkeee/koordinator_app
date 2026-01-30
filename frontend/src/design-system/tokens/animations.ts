/**
 * Design System - Animation Tokens
 *
 * Единая система анимаций для плавных переходов и взаимодействий.
 *
 * CSS Custom Properties (Use these for all animations):
 * - --duration-fast: 150ms - Quick micro-interactions (hover, focus, button press)
 * - --duration-normal: 200ms - Standard transitions (menu open/close, panel slide)
 * - --duration-slow: 300ms - Deliberate animations (page load, complex transitions)
 * - --easing-out: cubic-bezier(0.4, 0, 0.2, 1) - Standard exits (smooth deceleration)
 * - --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1) - Enter animations (subtle overshoot)
 */

export const animations = {
  // Teams-like snappy transitions
  fadeIn: 'animate-in fade-in duration-200 ease-out',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-300 ease-out',
  zoomIn: 'animate-in zoom-in-98 duration-200 ease-out',
  fadeOut: 'animate-out fade-out duration-150 ease-in',
  outCollapse: 'animate-out fade-out slide-out-to-top-2 duration-200 ease-in',

  // Transitions
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-250 ease-in-out',

  // Interactive effects
  hoverSubtle: 'hover:bg-black/5 transition-colors duration-150',
  hoverLift: 'hover:-translate-y-0.5 transition-transform duration-200 ease-out',
  press: 'active:scale-95 transition-transform duration-100',
  pressSubtle: 'active:scale-[0.98] transition-transform duration-100',
} as const;

export type AnimationToken = typeof animations;
