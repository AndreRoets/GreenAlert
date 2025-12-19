import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';

export default function AddExpenseScreen() {
  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppText style={styles.header}>Add Expense</AppText>
      <AppText style={[styles.subHeader, { color: theme.textSecondary }]}>Be intentional. Is this expense truly necessary?</AppText>

      {/* Placeholder for form inputs */}
      <View style={styles.form}>
        <AppInput style={styles.input} placeholder="Amount ($)" keyboardType="numeric" />
        <AppInput style={styles.input} placeholder="Description (e.g., Coffee)" />
        <AppText style={styles.riskLabel}>Assess The Risk:</AppText>
        {/* Placeholder for risk buttons */}
        <View style={styles.riskButtons}>
            <AppText style={{color: theme.textSecondary}}>Risk assessment buttons here</AppText>
        </View>
      </View>

      <AppButton title="Log Expense" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding
  },
  header: {
    ...FONTS.h2,
    marginBottom: SIZES.base,
    textAlign: 'center'
  },
  subHeader: {
    ...FONTS.body3,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2
  },
  form: { flex: 1 },
  input: { marginBottom: SIZES.base * 2 },
  riskLabel: { ...FONTS.h4, marginTop: SIZES.padding },
  riskButtons: { marginTop: 10, alignItems: 'center' },
});