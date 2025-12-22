import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { saveToStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppCard from './AppCard';
import { useTheme } from '../contexts/ThemeContext';

export default function BudgetSetupScreen({ route, navigation }) {
  const { activeCategories, isGuest, currency, existingBudget } = route.params;

  // Initialize state with existing budget data if it exists
  const [totalBudget, setTotalBudget] = useState(existingBudget?.totalBudget?.toString() || '');
  const [paymentDay, setPaymentDay] = useState(existingBudget?.paymentDay?.toString() || '');
  const [categoryBudgets, setCategoryBudgets] = useState(
    activeCategories.reduce((acc, cat) => {
      const existingAmount = existingBudget?.categoryBudgets?.[cat];
      return {
        ...acc,
        // Use existing amount if it's a positive number, otherwise default to empty string
        [cat]: (existingAmount && existingAmount > 0) ? existingAmount.toString() : ''
      };
    }, {})
  );

  const handleCategoryChange = (category, amount) => {
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(amount)) {
      setCategoryBudgets(prev => ({ ...prev, [category]: amount }));
    }
  };

  const handleTotalBudgetChange = (amount) => {
    if (/^\d*\.?\d*$/.test(amount)) {
      setTotalBudget(amount);
    }
  };

  const handlePaymentDayChange = (day) => {
    const dayNum = parseInt(day, 10);
    if (/^\d*$/.test(day) && (day === '' || (dayNum >= 1 && dayNum <= 31))) {
      setPaymentDay(day);
    }
  };

  const allocated = Object.values(categoryBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const total = parseFloat(totalBudget) || 0;
  const remaining = total - allocated;

  const handleDone = async () => {
    if (total <= 0) {
      Alert.alert("Invalid Amount", "Please enter a total budget amount greater than zero.");
      return;
    }
    if (!paymentDay || parseInt(paymentDay, 10) <= 0) {
      Alert.alert("Invalid Date", "Please enter a valid payment day (1-31).");
      return;
    }

    const budgetData = {
      totalBudget: total,
      paymentDay: parseInt(paymentDay, 10),
      categoryBudgets: Object.entries(categoryBudgets).reduce((acc, [key, value]) => ({ ...acc, [key]: parseFloat(value) || 0 }), {}),
      currency: currency,
    };

    if (!isGuest) {
      await saveToStorage('userBudget', budgetData);
      await saveToStorage('userCategories', activeCategories);
      await saveToStorage('hasCompletedOnboarding', true);
    }
    navigation.navigate('Dashboard', { budgetData, isGuest }); // Pass data for guest mode
  };

  const { theme } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <AppText style={styles.header}>Set Your Budget</AppText>
        <AppText style={styles.body}>Enter your total budget and assign an amount to each category.</AppText>

        <AppCard style={styles.totalContainer}>
          <AppText style={styles.totalLabel}>Total Budget Amount</AppText>
          <AppInput
            style={StyleSheet.flatten([styles.totalInput, { color: theme.text }])}
            placeholderTextColor={theme.textSecondary}
            placeholder={`${currency.symbol}0.00`}
            keyboardType="numeric"
            value={totalBudget}
            onChangeText={handleTotalBudgetChange}
          />
          <AppText style={[styles.remainingText, { color: remaining < 0 ? COLORS.error : COLORS.success }]}>
            Remaining: {currency.symbol}{remaining.toFixed(2)}
          </AppText>
        </AppCard>

        <View style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
          <AppText style={styles.categoryText}>When do you get paid?</AppText>
          <AppInput
            style={StyleSheet.flatten([styles.categoryInput, { color: theme.text }])}
            placeholderTextColor={theme.textSecondary}
            placeholder="Day of month (e.g., 15)"
            keyboardType="number-pad"
            value={paymentDay}
            onChangeText={handlePaymentDayChange}
            maxLength={2}
          />
        </View>

        {activeCategories.map(category => (
          <View key={category} style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
            <AppText style={styles.categoryText}>{category}</AppText>
            <AppInput
              style={StyleSheet.flatten([styles.categoryInput, { color: theme.text }])}
              placeholderTextColor={theme.textSecondary}
              placeholder={`${currency.symbol}0.00`}
              keyboardType="numeric"
              value={categoryBudgets[category]}
              onChangeText={(text) => handleCategoryChange(category, text)}
            />
          </View>
        ))}
      </ScrollView>
      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Finish Setup" onPress={handleDone} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: SIZES.padding },
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base },
  body: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding, alignSelf: 'center' },
  totalContainer: { marginBottom: SIZES.padding, alignItems: 'center' },
  totalLabel: { ...FONTS.h4 },
  totalInput: {
    ...FONTS.h1,
    height: 'auto',
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginVertical: SIZES.base,
  },
  remainingText: { ...FONTS.h4, marginTop: SIZES.base },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  categoryText: { ...FONTS.body3, flex: 1 },
  categoryInput: {
    ...FONTS.body3,
    height: 45,
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'right',
    minWidth: 120,
    paddingHorizontal: 0,
  },
  footer: {
    padding: SIZES.padding,
    borderTopWidth: 1,
  },
});