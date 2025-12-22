import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { loadFromStorage, saveToStorage } from '../services/storage';
import { COLORS } from '../constants/theme';

const ThemeContext = createContext();

// Fallback theme definitions in case they aren't in COLORS
const themes = {
  light: {
    ...COLORS,
    ...(COLORS.light || {}),
    // Force these values to ensure visibility in Light Mode
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    card: '#FFFFFF',
    inputBackground: '#F5F5F5',
  },
  dark: {
    ...COLORS,
    ...(COLORS.dark || {}),
    // Force these values to ensure visibility in Dark Mode
    background: '#121212',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    border: '#333333',
    card: '#1E1E1E',
    inputBackground: '#2C2C2C',
  }
};

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useDeviceColorScheme();
  const [themeMode, setThemeMode] = useState(deviceColorScheme || 'light');

  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await loadFromStorage('userTheme');
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    await saveToStorage('userTheme', newTheme);
  };

  const theme = themes[themeMode];

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);