import React from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { SIZES, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const AppInput = ({ style, placeholderTextColor, ...props }) => {
  const { theme } = useTheme();

  return (
    <TextInput
      style={[
        styles.input,
        { 
          backgroundColor: theme.inputBackground,
          borderColor: theme.border,
          color: theme.text,
        },
        style
      ]}
      placeholderTextColor={placeholderTextColor || theme.textSecondary}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    height: 55,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    borderWidth: 1,
    ...FONTS.body3,
  },
});

export default AppInput;