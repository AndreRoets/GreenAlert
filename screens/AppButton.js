import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme'; // Assuming AppText is not a default export
import { useTheme } from '../contexts/ThemeContext';

const AppButton = ({ title, onPress, variant = 'primary', style, disabled }) => {
  const { theme } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const buttonStyles = [styles.button, style];
  const textStyles = [styles.text];

  if (variant === 'primary') {
    buttonStyles.push({ backgroundColor: disabled ? theme.border : COLORS.primary });
    textStyles.push({ color: '#FFFFFF' });
  } else if (variant === 'secondary') {
    buttonStyles.push({
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.border,
    });
    textStyles.push({ color: theme.text }); // Use theme's text color
  }

  return (
    <Animated.View style={{ width: '100%', transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        disabled={disabled}
      >
        <Text style={textStyles}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: SIZES.radius * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: SIZES.base,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  text: {
    ...FONTS.h4,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default AppButton;