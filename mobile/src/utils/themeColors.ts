// Theme color utilities for dark/light mode support

export type Theme = 'light' | 'dark'

export const THEME_COLORS = {
  light: {
    background: '#ffffff',
    surface: '#f9fafb',
    surfaceSecondary: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    primary: '#0045a0',
    primaryLight: '#dbeafe',
    success: '#10b981',
    successLight: '#d1fae5',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    border: '#334155',
    borderLight: '#475569',
    primary: '#0ea5e9',
    primaryLight: '#164e63',
    success: '#10b981',
    successLight: '#064e3b',
    danger: '#ef4444',
    dangerLight: '#7f1d1d',
    warning: '#f59e0b',
    warningLight: '#78350f',
    info: '#3b82f6',
    infoLight: '#1e3a8a',
  },
}

export const getThemeColors = (theme: Theme) => THEME_COLORS[theme]
