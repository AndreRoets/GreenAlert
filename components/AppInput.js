import React from 'react';
import { TextInput, StyleSheet, useColorScheme } from 'react-native';
import { COLORS, SIZES, FONTS } from '../constants/theme';

const AppInput = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  const inputStyle = {
    backgroundColor: theme.input,
    borderColor: theme.border,
    color: theme.text,
    ...styles.input,
    ...style,
  };

  return (
    <TextInput
      style={inputStyle}
      placeholderTextColor={theme.textSecondary}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    ...FONTS.body3,
    height: 55,
    paddingHorizontal: SIZES.padding / 1.5,
    borderRadius: SIZES.radius,
    borderWidth: 1,
  },
});

export default AppInput;