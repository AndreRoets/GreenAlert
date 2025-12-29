import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const AppCard = ({ children, style }) => {
  const { theme, themeMode } = useTheme();

  const cardStyle = {
    backgroundColor: theme.card,
    borderWidth: themeMode === 'dark' ? 1 : 0,
    borderColor: theme.border,
    ...styles.card,
    ...style,
  };

  // Simple shadow for iOS, elevation for Android
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: {
      elevation: 5,
    },
  });

  return <View style={[cardStyle, shadowStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding,
    width: '100%',
  },
});

export default AppCard;