import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const AppButton = ({ title, onPress, variant = 'primary', style }) => {
  const { theme } = useTheme();

  const buttonStyles = [styles.button, style];
  const textStyles = [styles.text];

  if (variant === 'primary') {
    buttonStyles.push({ backgroundColor: COLORS.primary });
    textStyles.push({ color: '#FFFFFF' });
  } else if (variant === 'secondary') {
    buttonStyles.push({
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.border,
    });
    textStyles.push({ color: theme.text });
  }

  return (
    <TouchableOpacity style={buttonStyles} onPress={onPress}>
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 55,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: SIZES.base,
  },
  text: {
    ...FONTS.h4,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppButton;