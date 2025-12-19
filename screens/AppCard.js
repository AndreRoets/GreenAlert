import React from 'react';
import { View, StyleSheet, useColorScheme, Platform } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const AppCard = ({ children, style }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

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