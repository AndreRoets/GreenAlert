import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Base
  primary: '#00A896', // Mint/Teal Green
  secondary: '#FFC857', // Soft Yellow/Amber

  // Status
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',

  // Light Theme
  light: {
    background: '#F8F7F4', // Warm Off-White
    card: '#FFFFFF',
    text: '#0D0D0D', // Near Black
    textSecondary: '#6B7280', // Muted Gray
    input: '#FFFFFF',
    border: '#E5E7EB',
    icon: '#4B5563',
  },

  // Dark Theme
  dark: {
    background: '#121212', // Near Black/Charcoal
    card: '#1F1F1F', // Dark Gray
    text: '#E5E7EB', // Light Gray
    textSecondary: '#9CA3AF', // Muted Light Gray
    input: '#2A2A2A',
    border: '#374151',
    icon: '#D1D5DB',
  },
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 24,

  // Font sizes
  h1: 48,
  h2: 28,
  h3: 22,
  h4: 18,
  body1: 36, // For large money values
  body2: 24,
  body3: 16,
  body4: 14,

  // App dimensions
  width,
  height,
};

export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: 'bold' },
  h2: { fontSize: SIZES.h2, fontWeight: 'bold' },
  h3: { fontSize: SIZES.h3, fontWeight: '600' }, // Medium-weight
  h4: { fontSize: SIZES.h4, fontWeight: '600' },
  body1: { fontSize: SIZES.body1, fontWeight: 'bold' },
  body2: { fontSize: SIZES.body2, fontWeight: 'normal' },
  body3: { fontSize: SIZES.body3, fontWeight: 'normal' },
  body4: { fontSize: SIZES.body4, fontWeight: 'normal' },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;