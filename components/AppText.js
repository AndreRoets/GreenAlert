import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const AppText = ({ style, children, ...props }) => {
  const { theme } = useTheme();

  const textStyle = [
    styles.default,
    { color: theme.text },
    style
  ];

  return <Text style={textStyle} {...props}>{children}</Text>;
};

const styles = StyleSheet.create({ default: { fontSize: 16 } });

export default AppText;