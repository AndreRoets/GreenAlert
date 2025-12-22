import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';

export default function DisposableSetupScreen({ route, navigation }) {
  const { activeCategories, isGuest, currency, existingBudget } = route.params;

  const [disposableIncome, setDisposableIncome] = useState(existingBudget?.total?.toString() || '');
  const [paymentDay, setPaymentDay] = useState(existingBudget?.paymentDay?.toString() || '');

  const handleIncomeChange = (amount) => {
    if (/^\d*\.?\d*$/.test(amount)) {
      setDisposableIncome(amount);
    }
  };

  const handlePaymentDayChange = (day) => {
    const dayNum = parseInt(day, 10);
    if (/^\d*$/.test(day) && (day === '' || (dayNum >= 1 && dayNum <= 31))) {
      setPaymentDay(day);
    }
  };

  const handleNext = () => {
    const total = parseFloat(disposableIncome) || 0;
    if (total <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than zero.");
      return;
    }
    if (!paymentDay || parseInt(paymentDay, 10) <= 0) {
      Alert.alert("Invalid Date", "Please enter a valid payment day (1-31).");
      return;
    }

    // Pass the data to the next screen to choose weekly/monthly
    navigation.navigate('LeftoverBudget', {
      unallocated: total,
      paymentDay: parseInt(paymentDay, 10),
      activeCategories: activeCategories, // Pass categories along
      isGuest,
      currency,
      existingBudget, // Pass existing budget data along
    });
  };

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}
    >
      <View style={styles.scrollContainer}>
        <AppText style={styles.header}>Disposable Income</AppText>
        <AppText style={styles.body}>Enter your total disposable income for the month and when you get paid.</AppText>

        <View style={styles.inputGroup}>
          <AppText style={styles.inputLabel}>Total Disposable Income</AppText>
          <AppInput
            placeholder={`${currency.symbol}0.00`}
            placeholderTextColor={theme.textSecondary}
            style={{ color: theme.text }}
            keyboardType="numeric"
            value={disposableIncome}
            onChangeText={handleIncomeChange}
          />
        </View>

        <View style={styles.inputGroup}>
          <AppText style={styles.inputLabel}>When do you get paid?</AppText>
          <AppInput
            placeholder="Day of month (e.g., 15)"
            placeholderTextColor={theme.textSecondary}
            style={{ color: theme.text }}
            keyboardType="number-pad"
            value={paymentDay}
            onChangeText={handlePaymentDayChange}
            maxLength={2}
          />
        </View>
      </View>
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Next" onPress={handleNext} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: SIZES.padding, flex: 1, justifyContent: 'center' },
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base * 2 },
  body: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding * 2, alignSelf: 'center' },
  inputGroup: {
    marginBottom: SIZES.padding,
  },
  inputLabel: { ...FONTS.h4, marginBottom: SIZES.base * 1.5 },
  input: {},
  footer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
  },
});