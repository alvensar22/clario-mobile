/**
 * Clario theme: black background, white text, neutral grays, purple/pink accent.
 * Matches clario-web design.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#ffffff',
    textSecondary: '#a3a3a3',
    background: '#000000',
    card: '#0a0a0a',
    border: '#262626',
    tint: '#a855f7',
    tabIconDefault: '#737373',
    tabIconSelected: '#ffffff',
    error: '#f87171',
    success: '#4ade80',
    inputBg: '#171717',
    inputBorder: '#404040',
  },
  dark: {
    text: '#ffffff',
    textSecondary: '#a3a3a3',
    background: '#000000',
    card: '#0a0a0a',
    border: '#262626',
    tint: '#a855f7',
    tabIconDefault: '#737373',
    tabIconSelected: '#ffffff',
    error: '#f87171',
    success: '#4ade80',
    inputBg: '#171717',
    inputBorder: '#404040',
  },
};

/** Gradient accent (purple to pink) - use for highlights */
export const Accent = {
  purple: '#a855f7',
  pink: '#ec4899',
};

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: 'normal',
    mono: "Menlo, Monaco, Consolas, monospace",
  },
});
