import { applyChartTheme } from './chartTheme';

export type Appearance = 'dark' | 'light';

export const APPEARANCE_KEY = 'appearance';

export const appearanceList: Record<Appearance, string> = {
  dark: 'Dark',
  light: 'Light',
};

export function readAppearance(): Appearance {
  try {
    const value = JSON.parse(localStorage.getItem(APPEARANCE_KEY) || '""');
    return value === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyAppearance(appearance: Appearance) {
  const mode: Appearance = appearance === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.appearance = mode;
  document.documentElement.style.colorScheme = mode;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', mode === 'light' ? '#f4f6fb' : '#0c1424');
  }
  applyChartTheme(mode);
}

export function persistAppearance(appearance: Appearance) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
  applyAppearance(appearance);
}
