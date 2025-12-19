import React from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { COLORS } from '../constants/theme';

const AppText = ({ style, children, ...props }) => {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  const textStyle = {
    color: theme.text,
    ...styles.default,
    ...style,
  };

  return <Text style={textStyle} {...props}>{children}</Text>;
};

const styles = StyleSheet.create({ default: { fontSize: 16 } });

export default AppText;