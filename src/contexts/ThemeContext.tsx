import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('avicola-theme');
      return (saved === 'dark' || saved === 'light') ? saved : 'light';
    } catch {
      return 'light';
    }
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    localStorage.setItem('avicola-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

/* ─── Theme-aware color helper ─── */
export function t(isDark: boolean) {
  return {
    // Page backgrounds
    bgPage:          isDark ? '#000000' : '#f3f4f6',
    // Sidebar & Header
    bgSidebar:       isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.97)',
    bgSidebarAlt:    isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.95)',
    bgSidebarMobile: isDark ? 'rgba(0,0,0,0.95)' : '#ffffff',
    bgHeader:        isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.97)',
    bgHeaderAlt:     isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.95)',
    // Content areas
    bgCard:          isDark ? 'rgba(0,0,0,0.3)' : '#ffffff',
    bgCardAlt:       isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.02)',
    bgInput:         isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    bgTableHeader:   isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)',
    bgTableRow:      isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.01)',
    bgHover:         isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    // Glass layers (G-tokens)
    g02: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    g03: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    g04: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    g06: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    g08: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    g10: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    g15: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
    g20: isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.15)',
    g30: isDark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.20)',
    // Modals
    bgModal:         isDark ? 'rgba(0,0,0,0.95)' : '#ffffff',
    bgModalOverlay:  isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
    // Text
    text:            isDark ? '#ffffff' : '#1a1a2e',
    textSecondary:   isDark ? '#9ca3af' : '#4a5568',
    textMuted:       isDark ? '#6b7280' : '#718096',
    // Borders
    border:          isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)',
    borderSubtle:    isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    // Gold accent borders (same in both themes)
    borderGold:      'rgba(204,170,0,0.2)',
    // Shadows
    shadowSm:  isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
    shadowMd:  isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
    shadowLg:  isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
    shadowSidebar: isDark ? '4px 0 20px rgba(0,0,0,0.5)' : '4px 0 20px rgba(0,0,0,0.06)',
    shadowHeader: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
    // Tailwind class helpers
    textClass:    isDark ? 'text-white' : 'text-gray-800',
    textSecClass: isDark ? 'text-gray-400' : 'text-gray-600',
    textMutClass: isDark ? 'text-gray-500' : 'text-gray-500',
    // Scrollbar
    scrollbarThumb:      isDark ? 'rgba(204,170,0,0.5)' : 'rgba(204,170,0,0.3)',
    scrollbarThumbHover: isDark ? 'rgba(204,170,0,0.7)' : 'rgba(204,170,0,0.5)',
    // Nav
    inactiveNav: isDark ? '#9ca3af' : '#4a5568',
    // Overlay for mobile nav
    mobileOverlay: isDark ? 'bg-black/80' : 'bg-black/30',
  };
}
