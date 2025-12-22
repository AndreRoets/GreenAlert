import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SIZES } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const AppCard = ({ children, style }) => {
  const { theme } = useTheme();

  const cardStyle = {
    backgroundColor: theme.card,
    ...styles.card,
    ...style,
  };

  // Simple shadow for iOS, elevation for Android
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
    },
    android: {
      elevation: 5,
    },
  });

  return <View style={[cardStyle, shadowStyle]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius * 1.5,
    padding: SIZES.padding,
    width: '100%',
  },
});

export default AppCard;