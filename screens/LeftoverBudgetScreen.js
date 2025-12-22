import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { saveToStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppCard from './AppCard';
import useCurrentDate from '../hooks/useCurrentDate';
import { useTheme } from '../contexts/ThemeContext';

export default function LeftoverBudgetScreen({ route, navigation }) {
  const { unallocated, paymentDay, activeCategories, isGuest, currency } = route.params;
  const [view, setView] = useState(null); // 'daily' or 'weekly'
  const [isCustomizeModalVisible, setCustomizeModalVisible] = useState(false);
  const [isSavingsModalVisible, setSavingsModalVisible] = useState(false);

  const [savingsGoal, setSavingsGoal] = useState('');
  const [dailyBudgets, setDailyBudgets] = useState([]);
  const [weeklyBudgets, setWeeklyBudgets] = useState([]);

  // This flag tracks if the user has entered the customization modal
  const [hasCustomized, setHasCustomized] = useState(false);

  const today = useCurrentDate();
  const { theme } = useTheme();

  const calculateDaysLeft = useMemo(() => {
    if (!paymentDay) return 0;

    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let periodEndDate;
    if (currentDay < paymentDay) {
      periodEndDate = new Date(currentYear, currentMonth, paymentDay);
    } else {
      const nextMonth = new Date(today);
      nextMonth.setMonth(currentMonth + 1);
      periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay);
    }
    // Set time to the end of the day to include the last day fully
    periodEndDate.setHours(23, 59, 59, 999);
    const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [paymentDay, today]);

  const daysLeft = calculateDaysLeft;
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

  const savingsAmount = parseFloat(savingsGoal) || 0;
  const spendableUnallocated = unallocated - savingsAmount;

  // Prevent division by zero if there are no days/weeks left
  const weeklyAverage = weeksLeft > 0 ? spendableUnallocated / weeksLeft : 0;
  const dailyAverage = daysLeft > 0 ? spendableUnallocated / daysLeft : 0;

  // Calculate savings per period
  const dailySavings = daysLeft > 0 ? savingsAmount / daysLeft : 0;
  const weeklySavings = weeksLeft > 0 ? savingsAmount / weeksLeft : 0;

  const allocatedSum = useMemo(() => {
    if (!hasCustomized) return 0;
    const budgets = view === 'daily' ? dailyBudgets : (view === 'weekly' ? weeklyBudgets : []);
    return budgets.reduce((sum, val) => sum + (parseFloat(val) || 0), 0) || 0;
  }, [view, dailyBudgets, weeklyBudgets, hasCustomized]);

  const remainingToAllocate = spendableUnallocated - allocatedSum;

  const handleSelectView = (selectedView) => {
    if (view === selectedView) {
      setView(null); // Allow un-selecting
    } else {
      setView(selectedView);
      setHasCustomized(false); // Reset customization when view changes
      // Initialize budget arrays when view is selected
      if (selectedView === 'daily') {
        setDailyBudgets(Array(daysLeft).fill(''));
      } else if (selectedView === 'weekly') {
        setWeeklyBudgets(Array(weeksLeft).fill(''));
      }
    }
  };

  const handleBudgetChange = (index, amount) => {
    if (!/^\d*\.?\d*$/.test(amount)) return;

    if (view === 'daily') {
      const newBudgets = [...dailyBudgets];
      newBudgets[index] = amount;
      setDailyBudgets(newBudgets);
    } else if (view === 'weekly') {
      const newBudgets = [...weeklyBudgets];
      newBudgets[index] = amount;
      setWeeklyBudgets(newBudgets);
    }
  };

  const handleSavingsChange = (amount) => {
    if (!/^\d*\.?\d*$/.test(amount)) return;
    const numericAmount = parseFloat(amount) || 0;
    // Ensure savings goal doesn't exceed unallocated amount
    setSavingsGoal(numericAmount > unallocated ? unallocated.toString() : amount);
  };

  const handleDone = async () => {
    if (!view) {
      Alert.alert("Selection Needed", "Please select a daily or weekly budget view.");
      return;
    }

    // If user customized, save the detailed budgets. Otherwise, they will be undefined.
    const budgetData = {
      total: unallocated,
      paymentDay: paymentDay,
      savingsGoal: savingsAmount,
      viewPreference: view,
      dailyBudgets: view === 'daily' && hasCustomized ? dailyBudgets.map(b => parseFloat(b) || 0) : undefined,
      weeklyBudgets: view === 'weekly' && hasCustomized ? weeklyBudgets.map(b => parseFloat(b) || 0) : undefined,
    };
    budgetData.currency = currency;

    if (!isGuest) {
      // We only save the budget here. Categories are handled on the next screens.
      await saveToStorage('userBudget', budgetData);
      await saveToStorage('hasCompletedOnboarding', true);
    }

    // Navigate to category setup for this disposable/leftover amount
    navigation.navigate('DisposableCategorySetup', {
      isGuest,
      currency,
      activeCategories, // Pass the categories along
      // Pass the budget data configured on this screen
      budget: budgetData,
    });
  };

  const formatDateForDay = (dayIndex) => {
    const date = new Date(today.getTime());    date.setDate(today.getDate() + dayIndex);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <AppText style={styles.header}>Budget Your Leftover Money</AppText>

        <AppCard style={styles.leftoverContainer}>
          <AppText style={styles.leftoverLabel}>Money Left Over</AppText>
          <AppText style={styles.leftoverAmount}>{currency.symbol}{unallocated.toFixed(2)}</AppText>
          <AppText style={styles.remainingText}>for the next {daysLeft} days</AppText>
        </AppCard>

        <AppButton
          variant="secondary"
          onPress={() => setSavingsModalVisible(true)}
          title={savingsAmount > 0 ? `Edit Savings Goal (${currency.symbol}${savingsAmount.toFixed(2)})` : 'Set a Savings Goal'}
        />
        <AppText style={styles.subHeader}>Spendable: <AppText style={styles.bold}>{currency.symbol}{spendableUnallocated.toFixed(2)}</AppText></AppText>

        <View style={styles.optionsContainer}>
          <AppButton
            style={styles.optionButton}
            variant={view === 'daily' ? 'primary' : 'secondary'}
            onPress={() => handleSelectView('daily')}
            title="Budget Daily"
          />
          <AppButton
            style={styles.optionButton}
            variant={view === 'weekly' ? 'primary' : 'secondary'}
            onPress={() => handleSelectView('weekly')}
            title="Budget Weekly"
          />
        </View>

        {view === 'daily' && (
          <AppCard style={styles.resultContainer}>
            <View style={styles.resultRow}>
              <AppText style={styles.resultLabel}>Daily Fun Money:</AppText>
              <AppText style={styles.resultAmount}>{currency.symbol}{dailyAverage.toFixed(2)}</AppText>
              <AppText style={styles.resultLabel}>Daily Savings:</AppText>
              <AppText style={[styles.resultAmount, { color: COLORS.primary, fontSize: 32 }]}>{currency.symbol}{dailySavings.toFixed(2)}</AppText>
            </View>
            <AppButton variant="secondary" title="Customize Allocation" onPress={() => { setCustomizeModalVisible(true); setHasCustomized(true); }} />
          </AppCard>
        )}

        {view === 'weekly' && (
          <AppCard style={styles.resultContainer}>
            <View style={styles.resultRow}>
              <AppText style={styles.resultLabel}>Weekly Fun Money:</AppText>
              <AppText style={styles.resultAmount}>{currency.symbol}{weeklyAverage.toFixed(2)}</AppText>
              <AppText style={styles.resultLabel}>Weekly Savings:</AppText>
              <AppText style={[styles.resultAmount, { color: COLORS.primary, fontSize: 32 }]}>{currency.symbol}{weeklySavings.toFixed(2)}</AppText>
            </View>
            <AppButton variant="secondary" title="Customize Allocation" onPress={() => { setCustomizeModalVisible(true); setHasCustomized(true); }} />
          </AppCard>
        )}

      </ScrollView>

      <Modal
        animationType="slide"
        visible={isCustomizeModalVisible}
        onRequestClose={() => setCustomizeModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <AppText style={styles.header}>Customize Budget</AppText>
            <View style={[styles.allocationSummary, { borderBottomColor: theme.border }]}>
              <AppText style={styles.summaryText}>Allocated: {currency.symbol}{allocatedSum.toFixed(2)}</AppText>
              <AppText style={[styles.summaryText, { color: remainingToAllocate < 0 ? COLORS.error : theme.textSecondary }]}>
                Remaining: {currency.symbol}{remainingToAllocate.toFixed(2)}
              </AppText>
            </View>

            {view === 'daily' && dailyBudgets.map((budget, index) => (
              <View key={index} style={[styles.inputRow, { borderBottomColor: theme.border }]}>
                <AppText style={styles.inputLabel}>{formatDateForDay(index)}</AppText>
                <AppInput
                  style={StyleSheet.flatten([styles.input, { color: theme.text }])}
                  placeholderTextColor={theme.textSecondary}
                  placeholder={`${currency.symbol}0.00`}
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={(text) => handleBudgetChange(index, text)}
                />
              </View>
            ))}

            {view === 'weekly' && weeklyBudgets.map((budget, index) => (
              <View key={index} style={[styles.inputRow, { borderBottomColor: theme.border }]}>
                <AppText style={styles.inputLabel}>Week {index + 1}</AppText>
                <AppInput
                  style={StyleSheet.flatten([styles.input, { color: theme.text }])}
                  placeholderTextColor={theme.textSecondary}
                  placeholder={`${currency.symbol}0.00`}
                  keyboardType="numeric"
                  value={budget}
                  onChangeText={(text) => handleBudgetChange(index, text)}
                />
              </View>
            ))}
          </ScrollView>
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <AppButton title="Done Customizing" onPress={() => setCustomizeModalVisible(false)} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSavingsModalVisible}
        onRequestClose={() => setSavingsModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <AppText style={styles.modalHeader}>Set Savings Goal</AppText>
            <AppInput
              style={StyleSheet.flatten([styles.modalInput, { color: theme.text }])}
              placeholderTextColor={theme.textSecondary}
              placeholder={`${currency.symbol}0.00`}
              keyboardType="numeric"
              value={savingsGoal}
              onChangeText={handleSavingsChange}
              autoFocus={true}
            />
            <View style={styles.modalButtonContainer}>
              <AppButton
                style={styles.modalButton}
                variant="secondary"
                onPress={() => setSavingsModalVisible(false)}
                title="Cancel"
              />
              <AppButton
                style={styles.modalButton}
                onPress={() => setSavingsModalVisible(false)}
                title="Set Goal"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Next" onPress={handleDone} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalContainer: { flex: 1, paddingTop: 40 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  scrollContainer: { padding: SIZES.padding, alignItems: 'center' },
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.padding, },
  subHeader: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding, },
  bold: { fontWeight: 'bold' }, // Color will be inherited from AppText
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: SIZES.base },
  optionButton: { width: '48%', marginVertical: 0 },
  leftoverContainer: { alignItems: 'center', marginBottom: SIZES.base },
  leftoverLabel: { ...FONTS.h4 },
  leftoverAmount: { ...FONTS.h1, marginVertical: SIZES.base },
  remainingText: { ...FONTS.body4 },
  resultContainer: { alignItems: 'center', width: '100%', marginTop: SIZES.padding },
  resultLabel: { ...FONTS.h4, marginBottom: SIZES.base },
  resultAmount: { ...FONTS.h1, color: COLORS.success, marginBottom: SIZES.padding },
  resultRow: { alignItems: 'center', width: '100%' },
  allocationSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  summaryText: { ...FONTS.body3, fontWeight: 'bold' },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  inputLabel: { ...FONTS.body3 },
  input: {
    height: 45,
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'right',
    minWidth: 120,
    paddingHorizontal: 0,
  },
  footer: { padding: SIZES.padding, borderTopWidth: 1 },
  modalContent: {
    padding: SIZES.padding,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
  },
  modalHeader: { ...FONTS.h3, marginBottom: SIZES.padding, textAlign: 'center' },
  modalInput: {
    ...FONTS.h2,
    height: 'auto',
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: { width: '48%', marginVertical: 0 },
});