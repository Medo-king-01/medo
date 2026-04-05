
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, Language, ThemeColor } from '../types';
import { StorageService, defaultSettings } from '../services/storage';
import { translations, TranslationKey } from '../utils/translations';
import { NotificationService } from '../services/notifications';
import { AudioService } from '../services/audioService';

interface SettingsContextType extends AppSettings {
  updateSettings: (updates: Partial<AppSettings>) => void;
  toggleNotifications: () => Promise<boolean>;
  t: (key: TranslationKey) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper to convert Hex to RGB string "r g b"
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` 
        : '0 0 0';
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = StorageService.loadSettings();
    setSettings(loaded);
    setIsLoaded(true);
    
    AudioService.setVolume(loaded.soundVolume ?? 0.5);
    AudioService.setMute(!loaded.soundEnabled);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    // 1. Language Direction
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';

    // 2. Dark Mode Class
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 3. Theme Variable Injection (RGB Format for Tailwind Opacity)
    const root = document.documentElement;
    let p_primary, p_dim, p_accent, p_bg, p_surface, p_highlight, p_border, p_text, p_muted;

    // Palette Definitions
    switch (settings.themeColor) {
      case 'blue-dark':
        p_primary = '#3b82f6';    // blue-500
        p_dim = '#1e40af';        // blue-800
        p_accent = '#60a5fa';     // blue-400
        
        if (settings.darkMode) {
            p_bg = '#020617';     // slate-950
            p_surface = '#0f172a'; // slate-900
            p_highlight = '#1e293b'; // slate-800
            p_border = '#334155'; // slate-700
            p_text = '#ffffff';
            p_muted = '#94a3b8';
        } else {
            p_bg = '#f0f9ff';     // sky-50
            p_surface = '#ffffff';
            p_highlight = '#e0f2fe'; // sky-100
            p_border = '#bae6fd'; // sky-200
            p_text = '#0c4a6e';   // sky-900
            p_muted = '#64748b';
        }
        break;

      case 'green-matrix':
        p_primary = '#22c55e';    // green-500 (Readable matrix)
        p_dim = '#14532d';        // green-900
        p_accent = '#4ade80';     // green-400
        
        if (settings.darkMode) {
            p_bg = '#000000';     // Pure Black
            p_surface = '#051a0d'; // Very dark green
            p_highlight = '#0a2f16';
            p_border = '#14532d';
            p_text = '#ecfccb';   // Lime tint white
            p_muted = '#4ade80';  // Matrix text color
        } else {
            p_bg = '#f0fdf4';
            p_surface = '#ffffff';
            p_highlight = '#dcfce7';
            p_border = '#86efac';
            p_text = '#052e16';
            p_muted = '#15803d';
        }
        break;

      case 'purple-royal':
        p_primary = '#d946ef';    // fuchsia-500
        p_dim = '#701a75';        // fuchsia-900
        p_accent = '#e879f9';     // fuchsia-400
        
        if (settings.darkMode) {
            p_bg = '#150529';     // Deep purple black
            p_surface = '#2e1065'; // violet-950
            p_highlight = '#4c1d95';
            p_border = '#6b21a8';
            p_text = '#ffffff';
            p_muted = '#c4b5fd';
        } else {
            p_bg = '#faf5ff';
            p_surface = '#ffffff';
            p_highlight = '#f3e8ff';
            p_border = '#e9d5ff';
            p_text = '#4a044e';
            p_muted = '#86198f';
        }
        break;

      case 'pink-white':
        p_primary = '#ff4d8d';    // Pink-500
        p_dim = '#be185d';        // Pink-700
        p_accent = '#ff87b3';     // Pink-300
        
        if (settings.darkMode) {
            p_bg = '#1f0812';     // Dark rose
            p_surface = '#3b0f20';
            p_highlight = '#831843';
            p_border = '#9d174d';
            p_text = '#ffffff';
            p_muted = '#fbcfe8';
        } else {
            p_bg = '#fff0f5';     // Lavender blush
            p_surface = '#ffffff';
            p_highlight = '#fce7f3';
            p_border = '#fbcfe8';
            p_text = '#831843';
            p_muted = '#be185d';
        }
        break;

      case 'red-black':
      default:
        p_primary = '#ef4444';    // Red-500
        p_dim = '#7f1d1d';        // Red-900
        p_accent = '#f87171';     // Red-400
        
        if (settings.darkMode) {
            p_bg = '#000000';     // Pure Black (Solo Leveling Style)
            p_surface = '#0a0a0a'; // Neutral-950
            p_highlight = '#171717'; // Neutral-900
            p_border = '#450a0a'; // Dark Red Border
            p_text = '#ffffff';
            p_muted = '#a3a3a3';
        } else {
            p_bg = '#fef2f2';     // Red-50
            p_surface = '#ffffff';
            p_highlight = '#fee2e2'; // Red-100
            p_border = '#fecaca'; // Red-200
            p_text = '#450a0a';   // Red-950
            p_muted = '#991b1b';
        }
        break;
    }

    // Set Properties (RGB format)
    root.style.setProperty('--color-bg', hexToRgb(p_bg));
    root.style.setProperty('--color-surface', hexToRgb(p_surface));
    root.style.setProperty('--color-surface-highlight', hexToRgb(p_highlight));
    root.style.setProperty('--color-border', hexToRgb(p_border));
    
    root.style.setProperty('--color-primary', hexToRgb(p_primary));
    root.style.setProperty('--color-primary-dim', hexToRgb(p_dim));
    root.style.setProperty('--color-accent', hexToRgb(p_accent));
    
    root.style.setProperty('--color-text', hexToRgb(p_text));
    root.style.setProperty('--color-text-muted', hexToRgb(p_muted));

    // Browser Interface Color (Meta Tag)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', p_bg);

    StorageService.saveSettings(settings);
  }, [settings, isLoaded]);

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleNotifications = async (): Promise<boolean> => {
    if (!settings.notificationsEnabled) {
      const granted = await NotificationService.requestPermission();
      if (granted) {
        updateSettings({ notificationsEnabled: true });
        return true;
      }
      return false;
    } else {
      updateSettings({ notificationsEnabled: false });
      return true;
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[settings.language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings, toggleNotifications, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within a SettingsProvider");
  return context;
};
