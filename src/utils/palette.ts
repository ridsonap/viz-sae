import { ChartColorPalette } from '../types/sae';

export const PALETTES: Record<ChartColorPalette, { primary: string; secondary: string; tertiary: string; quaternary: string; direct: string }> = {
  vibrant: {
    primary: '#6366f1',   // Indigo
    secondary: '#10b981', // Emerald
    tertiary: '#f59e0b',  // Amber
    quaternary: '#ec4899',// Pink
    direct: '#94a3b8',    // Slate
  },
  academic: {
    primary: '#1e3a8a',   // Deep Blue
    secondary: '#b91c1c', // Maroon
    tertiary: '#047857',  // Deep Forest
    quaternary: '#6b21a8',// Deep Purple
    direct: '#64748b',    // Slate
  },
  emerald: {
    primary: '#059669',   // Emerald
    secondary: '#0d9488', // Teal
    tertiary: '#d97706',  // Amber
    quaternary: '#2563eb',// Blue
    direct: '#94a3b8',    // Slate
  },
  colorblind: {
    primary: '#0072b2',   // Blue (Wong palette)
    secondary: '#e69f00', // Orange
    tertiary: '#009e73',  // Bluish Green
    quaternary: '#cc79a7',// Reddish Purple
    direct: '#7f7f7f',    // Gray
  },
};

export function getPaletteColors(palette: ChartColorPalette = 'vibrant') {
  return PALETTES[palette] || PALETTES.vibrant;
}
