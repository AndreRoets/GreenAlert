import React, { useState, useMemo, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet, TouchableOpacity,
  ScrollView, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
  useColorScheme,
} from 'react-native';
import { loadFromStorage } from '../services/storage';
import { scheduleBudgetNotifications } from '../services/notificationService';
import { useBudget } from '../contexts/BudgetContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppCard from './AppCard';

export default function DisposableDashboardScreen({ route, navigation }) {
  const [budget, setBudget] = useState(null);
  const [adjustedBudgets, setAdjustedBudgets] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [lastProcessedExpenseCount, setLastProcessedExpenseCount] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [lastWarningDate, setLastWarningDate] = useState(null);
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', necessary: false, category: '' });
  const [isLoading, setIsLoading] = useState(true);
  const { setBudgetDetails } = useBudget();
  const [categories, setCategories] = useState([]);

  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  useEffect(() => {
    const initializeBudget = async () => {
      console.log("Initializing budget...");
      setIsLoading(true);
      let initialBudget;
      let initialCategories;

      if (route.params?.budget && route.params?.categories) {
        // Budget was passed via navigation (e.g., after setup)
        initialBudget = route.params.budget;
        initialCategories = route.params.categories;
      } else {
        // No params, load from storage (e.g., on app start)
        initialBudget = await loadFromStorage('userBudget');
        // Load the specific categories for the disposable budget
        initialCategories = await loadFromStorage('disposableUserCategories');
      }

      if (initialBudget) {
        setBudget(initialBudget);
        setAdjustedBudgets(initialBudget.dailyBudgets || initialBudget.weeklyBudgets || []);
      }
      if (initialCategories) {
        setCategories(initialCategories);
        // Set default category for new expenses
        setNewExpense(prev => ({ ...prev, category: initialCategories[0] || '' }));
      }
      setIsLoading(false);
    };
    initializeBudget();
  }, [route.params?.budget, route.params?.categories]);

  const budgetDetails = useMemo(() => {
    if (!budget) {
      return {
        amount: 0,
        label: 'Loading...',
        currency: { symbol: '$' },
        recurringSpendsForView: [],
        status: 'green',
        oneOffSpendsForView: [],
        savingsForView: 0,
        overspentAmount: 0,
        statusColor: COLORS.success, // Default to green
      };
    }

    if (!budget.paymentDay) {
      return {
        amount: budget.total,
        label: 'Total Budget',
        isDaily: false,
        isWeekly: false,
        recurringSpendsForView: [],
        status: 'green',
        oneOffSpendsForView: [],
        savingsForView: 0,
        overspentAmount: 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        statusColor: COLORS.success,
      };
    }

    const calculateDaysLeft = () => {
      const today = new Date();
      const currentDay = today.getDate();
      let periodEndDate;
      if (currentDay < budget.paymentDay) {
        periodEndDate = new Date(today.getFullYear(), today.getMonth(), budget.paymentDay);
      } else {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), budget.paymentDay);
      }
      // Set time to the end of the day to include the last day fully
      periodEndDate.setHours(23, 59, 59, 999);
      const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysLeft = calculateDaysLeft();

    const spendableTotal = budget.total - (budget.savingsGoal || 0);
    const totalSavings = budget.savingsGoal || 0;

    if (budget.viewPreference === 'daily') {
      const displayDate = new Date();
      displayDate.setDate(displayDate.getDate() + currentDay - 1);
      const dayOfWeek = displayDate.getDay(); // 0 for Sun, 1 for Mon, etc.

      const oneOffSpendsForDay = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getFullYear() === displayDate.getFullYear() &&
               expDate.getMonth() === displayDate.getMonth() &&
               expDate.getDate() === displayDate.getDate();
      }).map(e => ({...e, isConfirmed: true})); // Mark these as confirmed

      const potentialRecurringSpends = (budget.recurringSpends || []).filter(
        spend => spend.selectedDays && spend.selectedDays[dayOfWeek] && spend.amount > 0
      );

      // Filter out recurring spends that have already been confirmed for today
      const unconfirmedRecurringSpends = potentialRecurringSpends.filter(recSpend => 
        !oneOffSpendsForDay.some(confSpend => confSpend.recurringSpendId === recSpend.id)
      );

      const oneOffTotal = oneOffSpendsForDay.reduce((sum, exp) => sum + exp.amount, 0);
      // Total spends are now ONLY confirmed (one-off) expenses
      const totalSpends = oneOffTotal;

      let dayFunMoneyBudget;
      const currentBudgets = adjustedBudgets.length > 0 ? adjustedBudgets : budget.dailyBudgets;
      if (currentBudgets && currentBudgets.length > 0) {
        dayFunMoneyBudget = currentBudgets[currentDay - 1] || 0;
      } else {
        dayFunMoneyBudget = daysLeft > 0 ? spendableTotal / daysLeft : 0;
      }
      
      const dailySavingsBudget = daysLeft > 0 ? totalSavings / daysLeft : 0;
      const funMoneyRemaining = dayFunMoneyBudget - totalSpends;
      
      const finalFunMoney = funMoneyRemaining; // This is the value to display as remaining fun money
      const overspentAmount = finalFunMoney < 0 ? Math.abs(finalFunMoney) : 0;
      const finalDailySavings = dailySavingsBudget - overspentAmount;

      let status = 'green';
      let statusColor = COLORS.success; // green
      if (finalFunMoney < 0) {
        status = 'red';
        statusColor = COLORS.error; // red
      } else if (dayFunMoneyBudget > 0 && finalFunMoney <= dayFunMoneyBudget / 3) {
        statusColor = COLORS.warning; // yellow
        status = 'yellow';
      }

      return {
        amount: finalFunMoney,
        label: 'Daily Budget',
        daysLeft: daysLeft,
        isWeekly: false,
        isDaily: true,
        recurringSpendsForView: unconfirmedRecurringSpends, // Show only unconfirmed
        oneOffSpendsForView: oneOffSpendsForDay,
        savingsForView: finalDailySavings,
        isSavingsNegative: finalDailySavings < 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        overspentAmount: overspentAmount,
        status: status,
        statusColor: statusColor,
      };
    }

    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

    if (budget.viewPreference === 'weekly') {

      const weekStartDate = new Date();
      weekStartDate.setDate(new Date().getDate() + (currentWeek - 1) * 7);
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      const oneOffSpendsForWeek = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStartDate && expDate <= weekEndDate;
      }).map(e => ({...e, isConfirmed: true})); // Mark as confirmed

      const potentialRecurringSpends = (budget.recurringSpends || []).map(spend => ({
        ...spend,
        // Calculate the weekly amount for each recurring spend
        amount: spend.amount * (spend.daysPerWeek || 0),
      })).filter(spend => spend.amount > 0);

      // Filter out recurring spends that have already been confirmed for this week
      const unconfirmedRecurringSpends = potentialRecurringSpends.filter(recSpend => 
        !oneOffSpendsForWeek.some(confSpend => confSpend.recurringSpendId === recSpend.id)
      );

      const oneOffTotal = oneOffSpendsForWeek.reduce((sum, exp) => sum + exp.amount, 0);

      // Total spends are now ONLY confirmed (one-off) expenses
      const totalSpends = oneOffTotal;

      let weekFunMoneyBudget;
      const currentBudgets = adjustedBudgets.length > 0 ? adjustedBudgets : budget.weeklyBudgets;
      if (currentBudgets && currentBudgets.length > 0) {
        weekFunMoneyBudget = currentBudgets[currentWeek - 1] || 0;
      } else {
        weekFunMoneyBudget = weeksLeft > 0 ? spendableTotal / weeksLeft : 0;
      }

      const weeklySavingsBudget = weeksLeft > 0 ? totalSavings / weeksLeft : 0;
      const funMoneyRemaining = weekFunMoneyBudget - totalSpends;

      const finalFunMoney = funMoneyRemaining; // This is the value to display as remaining fun money
      const overspentAmount = finalFunMoney < 0 ? Math.abs(finalFunMoney) : 0;
      const finalWeeklySavings = weeklySavingsBudget - overspentAmount;

      let status = 'green';
      let statusColor = COLORS.success; // green
      if (finalFunMoney < 0) {
        status = 'red';
        statusColor = COLORS.error; // red
      } else if (weekFunMoneyBudget > 0 && finalFunMoney <= weekFunMoneyBudget / 3) {
        statusColor = COLORS.warning; // yellow
        status = 'yellow';
      }

      return {
        amount: finalFunMoney,
        label: 'Weekly Budget',
        weeksLeft: weeksLeft,
        isWeekly: true,
        isDaily: false,
        recurringSpendsForView: unconfirmedRecurringSpends, // Show only unconfirmed
        oneOffSpendsForView: oneOffSpendsForWeek,
        savingsForView: finalWeeklySavings,
        isSavingsNegative: finalWeeklySavings < 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        overspentAmount: overspentAmount,
        status: status,
        statusColor: statusColor,
      };
    }

    return {
      amount: budget.total,
      label: 'Total Budget',
      isWeekly: false,
      isDaily: false,
      recurringSpendsForView: [],
      status: 'green',
      oneOffSpendsForView: [],
      savingsForView: 0,
      isSavingsNegative: false,
      currency: budget.currency || { symbol: '$', code: 'USD' },
      statusColor: COLORS.success,
      overspentAmount: 0,
    };
  }, [budget, adjustedBudgets, currentDay, currentWeek, expenses]);

  useEffect(() => {
    // Update the global context with the latest budget details
    setBudgetDetails(budgetDetails);
  }, [budgetDetails, setBudgetDetails]);

  useEffect(() => {
    if (budgetDetails.status) {
      scheduleBudgetNotifications(budgetDetails.status);
    }
  }, [budgetDetails.status]);

  useEffect(() => {
    if (budgetDetails.statusColor === COLORS.warning) {
      const today = new Date().toDateString();
      const periodIdentifier = budgetDetails.isDaily ? `${today}-day-${currentDay}` : `${today}-week-${currentWeek}`;

      if (lastWarningDate !== periodIdentifier) {
        Alert.alert(
          "Budget Warning",
          "You're getting close to your limit for this period. Be mindful of your next expenses!",
          [{ text: "OK" }]
        );
        setLastWarningDate(periodIdentifier);
      }
    }
  }, [
    budgetDetails.statusColor,
    lastWarningDate,
    budgetDetails.isDaily, currentDay, currentWeek
  ]);

  useEffect(() => {
    if (!budget || expenses.length <= lastProcessedExpenseCount) return;

    const { overspentAmount, isDaily, isWeekly, daysLeft, weeksLeft } =
      budgetDetails;

    if (overspentAmount > 0) {
      Alert.alert(
        "Budget Overspent",
        `You've overspent by ${budgetDetails.currency.symbol}${overspentAmount.toFixed(2)}. This will be deducted from your future budgets.`
      );

      // Use a fresh copy of the original budgets if they exist, otherwise start empty.
      let newAdjustedBudgets = budget.dailyBudgets ? [...budget.dailyBudgets] : (budget.weeklyBudgets ? [...budget.weeklyBudgets] : []);

      // If no pre-set budgets exist, create an evenly distributed one for the whole period.
      if (newAdjustedBudgets.length === 0) {
          const spendableTotal = budget.total - (budget.savingsGoal || 0);
          if (isDaily && daysLeft > 0) {
              const dailyAverage = spendableTotal / daysLeft;
              newAdjustedBudgets = Array(daysLeft).fill(dailyAverage); // Create for the entire period
          } else if (isWeekly && weeksLeft > 0) {
              const weeklyAverage = spendableTotal / weeksLeft;
              newAdjustedBudgets = Array(weeksLeft).fill(weeklyAverage); // Create for the entire period
          }
      }
      
      const index = isDaily ? currentDay : currentWeek;
      const remainingPeriods = newAdjustedBudgets.length - index;

      if (remainingPeriods > 0) {
        const deduction = overspentAmount / remainingPeriods;
        for (let i = index; i < newAdjustedBudgets.length; i++) {
          newAdjustedBudgets[i] = Math.max(0, (newAdjustedBudgets[i] || 0) - deduction);
        }
      }

      setAdjustedBudgets(newAdjustedBudgets);
    }
    setLastProcessedExpenseCount(expenses.length);
  }, [
    expenses,
    budgetDetails.overspentAmount,
    budgetDetails.isDaily,
    budgetDetails.isWeekly,
    budgetDetails.daysLeft,
    budgetDetails.weeksLeft, budgetDetails.currency,
    budget,
    currentDay,
    currentWeek,
    adjustedBudgets,
    lastProcessedExpenseCount,
  ]);

  const handleNextWeek = () => currentWeek < budgetDetails.weeksLeft && setCurrentWeek(currentWeek + 1);
  const handlePrevWeek = () => currentWeek > 1 && setCurrentWeek(currentWeek - 1);
  const handleNextDay = () => currentDay < budgetDetails.daysLeft && setCurrentDay(currentDay + 1);
  const handlePrevDay = () => currentDay > 1 && setCurrentDay(currentDay - 1);

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getDailyDateText = () => {
    const displayDate = new Date();
    displayDate.setDate(displayDate.getDate() + currentDay - 1);
    return formatDate(displayDate);
  };

  const getWeeklyDateText = () => {
    const weekStartDate = new Date();
    weekStartDate.setDate(new Date().getDate() + (currentWeek - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    return `${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}`;
  };

  const handleAddExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (!amount || amount <= 0 || !newExpense.description || !newExpense.category) {
      Alert.alert('Invalid Expense', 'Please enter a valid amount, description, and category.');
      return;
    }
    let expenseDate = new Date();
    if (budget.viewPreference === 'daily') {
      expenseDate.setDate(expenseDate.getDate() + currentDay - 1);
    }
    setExpenses([...expenses, { id: Date.now(), amount, description: newExpense.description, necessary: newExpense.necessary, category: newExpense.category, date: expenseDate.toISOString() }]);
    setNewExpense({ amount: '', description: '', necessary: false, category: categories[0] || '' });
    setModalVisible(false);
  };

  const handleRemoveExpense = (expenseId) => {
    Alert.alert(
      "Remove Expense",
      "Are you sure you want to remove this expense?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: () => setExpenses(currentExpenses => currentExpenses.filter(exp => exp.id !== expenseId)),
          style: "destructive"
        }
      ]
    );
  };

  const handleConfirmRecurringSpend = (spendToConfirm) => {
    let expenseDate = new Date();
    if (budget.viewPreference === 'daily') {
      expenseDate.setDate(expenseDate.getDate() + currentDay - 1);
    } else if (budget.viewPreference === 'weekly') {
      // For weekly, we can just use today's date within the current week
      expenseDate.setDate(new Date().getDate() + (currentWeek - 1) * 7);
    }

    const newExpense = {
      id: Date.now(),
      amount: spendToConfirm.amount,
      description: spendToConfirm.description,
      category: spendToConfirm.category,
      necessary: true, // Recurring spends are generally considered necessary/planned
      date: expenseDate.toISOString(),
      recurringSpendId: spendToConfirm.id, // Link back to the original recurring spend
    };

    setExpenses(prevExpenses => [...prevExpenses, newExpense]);
    Alert.alert(
      "Expense Confirmed",
      `"${spendToConfirm.description}" has been added to your spends for this period.`
    );
  };

  if (isLoading || !budget) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppCard style={styles.summaryContainer}>
        <AppText style={styles.label}>{budgetDetails.label}</AppText>
        <AppText style={[styles.amount, { color: budgetDetails.statusColor }]}>{budgetDetails.currency.symbol}{budgetDetails.amount.toFixed(2)}</AppText>
        <AppText style={styles.subAmount}>Remaining</AppText>

        {budget.savingsGoal > 0 && (
          <View style={[styles.savingsDisplay, { borderTopColor: theme.border }]}>
            <AppText style={styles.savingsLabel}>Savings This Period</AppText>
            <AppText style={[styles.savingsAmount, { color: budgetDetails.isSavingsNegative ? COLORS.error : COLORS.primary }]}>{budgetDetails.currency.symbol}{budgetDetails.savingsForView.toFixed(2)}</AppText>
          </View>
        )}

        {budgetDetails.isDaily && budgetDetails.daysLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevDay} disabled={currentDay <= 1}>
              <AppText style={[styles.arrow, currentDay <= 1 && styles.arrowDisabled]}>{'<'}</AppText>
            </TouchableOpacity>
            <AppText style={styles.weekText}>{getDailyDateText()}</AppText>
            <TouchableOpacity onPress={handleNextDay} disabled={!budgetDetails.daysLeft || currentDay >= budgetDetails.daysLeft}>
              <AppText style={[styles.arrow, (!budgetDetails.daysLeft || currentDay >= budgetDetails.daysLeft) && styles.arrowDisabled]}>{' >'}</AppText>
            </TouchableOpacity>
          </View>
        )}
        {budgetDetails.isWeekly && budgetDetails.weeksLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevWeek} disabled={currentWeek <= 1}>
              <AppText style={[styles.arrow, currentWeek <= 1 && styles.arrowDisabled]}>{'<'}</AppText>
            </TouchableOpacity>
            <AppText style={styles.weekText}>{getWeeklyDateText()}</AppText>
            <TouchableOpacity onPress={handleNextWeek} disabled={!budgetDetails.weeksLeft || currentWeek >= budgetDetails.weeksLeft}>
              <AppText style={[styles.arrow, (!budgetDetails.weeksLeft || currentWeek >= budgetDetails.weeksLeft) && styles.arrowDisabled]}>{' >'}</AppText>
            </TouchableOpacity>
          </View>
        )}
      </AppCard>

      <ScrollView style={styles.expenseList} showsVerticalScrollIndicator={false}>
        {(budgetDetails.recurringSpendsForView.length > 0 || budgetDetails.oneOffSpendsForView.length > 0) && (
          <AppText style={styles.expenseHeader}>Spends This Period</AppText>
        )}

        {budgetDetails.recurringSpendsForView.map((spend, index) => (
          <TouchableOpacity key={`rec-${index}`} style={[styles.expenseRow, { borderBottomColor: theme.border }, styles.unconfirmedExpenseRow]} onPress={() => handleConfirmRecurringSpend(spend)}>
            <View style={styles.expenseDetails}>
              <AppText style={styles.expenseDescription}>{spend.description} (Tap to confirm)</AppText>
              <AppText style={styles.unconfirmedExpenseAmount}>-{budgetDetails.currency.symbol}{spend.amount.toFixed(2)}</AppText>
            </View>
          </TouchableOpacity>
        ))}

        {budgetDetails.oneOffSpendsForView.map((expense) => (
          <View key={expense.id} style={[styles.expenseRow, { borderBottomColor: theme.border }, !expense.necessary && styles.unnecessaryExpenseRow]}>
            <View style={[styles.expenseDetails, {flex: 1}]}>
              <AppText style={styles.expenseDescription}>{expense.description}</AppText>
              <AppText style={styles.expenseAmount}>-{budgetDetails.currency.symbol}{expense.amount.toFixed(2)}</AppText>
            </View>
            <TouchableOpacity onPress={() => handleRemoveExpense(expense.id)} style={styles.removeExpenseButton}>
              <AppText style={styles.removeExpenseButtonText}>✕</AppText>
            </TouchableOpacity>
          </View>
        ))}

        {budgetDetails.recurringSpendsForView.length === 0 && budgetDetails.oneOffSpendsForView.length === 0 && (
          <View style={styles.placeholder}>
            <AppText style={{ color: theme.textSecondary }}>No spends for this period.</AppText>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <AppText style={styles.modalHeader}>Add Expense</AppText>
            <AppInput
              style={styles.modalInput}
              placeholder={`Amount (${budgetDetails.currency?.symbol || '$'})`}
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
            />
            <AppInput
              style={styles.modalInput}
              placeholder="Description (e.g., Lunch)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            />
            <TouchableOpacity style={[styles.categoryButton, { borderBottomColor: theme.border }]} onPress={() => setCategoryModalVisible(true)}>
              <AppText style={styles.categoryButtonText}>
                Category: {newExpense.category || 'Select...'}
              </AppText>
            </TouchableOpacity>
            <View style={styles.switchContainer}>
              <AppText style={styles.switchLabel}>Was this necessary?</AppText>
              <Switch
                trackColor={{ false: COLORS.dark.border, true: COLORS.primary }}
                thumbColor={Platform.OS === 'android' ? COLORS.primary : ''}
                onValueChange={(value) => setNewExpense({ ...newExpense, necessary: value })}
                value={newExpense.necessary} />
            </View>
            <View style={styles.modalButtonContainer}>
              <AppButton
                style={styles.modalButton}
                variant="secondary"
                onPress={() => setModalVisible(false)}
                title="Cancel"
              />
              <AppButton
                style={styles.modalButton}
                onPress={handleAddExpense}
                title="Save"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.categoryModalContent, { backgroundColor: theme.card }]}>
            <AppText style={styles.modalHeader}>Select Category</AppText>
            <ScrollView>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setNewExpense({ ...newExpense, category: cat });
                    setCategoryModalVisible(false);
                  }}
                >
                  <AppText style={styles.categoryItemText}>{cat}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>


      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Add Expense" onPress={() => setModalVisible(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  summaryContainer: { alignItems: 'center', marginBottom: SIZES.padding },
  savingsDisplay: {
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  savingsLabel: { ...FONTS.body3, color: COLORS.light.textSecondary },
  savingsAmount: { ...FONTS.h3 },
  label: { ...FONTS.h4, color: COLORS.light.textSecondary },
  amount: { ...FONTS.h1, fontSize: 64, marginVertical: SIZES.base },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
    width: '60%',
  },
  arrow: { ...FONTS.h2, paddingHorizontal: SIZES.base },
  arrowDisabled: { color: COLORS.light.textSecondary },
  weekText: { ...FONTS.h4 },
  subAmount: { ...FONTS.body3, color: COLORS.light.textSecondary, marginBottom: SIZES.base },
  expenseList: { flex: 1, width: '100%' },
  expenseHeader: { ...FONTS.h4, marginBottom: SIZES.base * 2 },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  unnecessaryExpenseRow: { backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  unconfirmedExpenseRow: { backgroundColor: 'rgba(0, 168, 150, 0.1)' },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDescription: { ...FONTS.body3, flex: 1 },
  expenseAmount: { ...FONTS.body3, fontWeight: 'bold', color: COLORS.error, marginLeft: SIZES.base },
  unconfirmedExpenseAmount: { ...FONTS.body3, fontWeight: 'bold', color: COLORS.light.textSecondary, marginLeft: SIZES.base },
  removeExpenseButton: {
    marginLeft: SIZES.base * 2,
    padding: SIZES.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeExpenseButtonText: {
    fontSize: 20,
    color: COLORS.light.textSecondary,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: SIZES.padding,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
  },
  modalHeader: { ...FONTS.h3, marginBottom: SIZES.padding, textAlign: 'center' },
  modalInput: { marginBottom: SIZES.base * 2 },
  categoryButton: {
    borderBottomWidth: 2,
    paddingVertical: 15,
    marginBottom: SIZES.padding,
  },
  categoryButtonText: { ...FONTS.body3 },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  switchLabel: { ...FONTS.body3, fontWeight: '500' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { width: '48%', marginVertical: 0 },
  categoryModalContent: {
    padding: SIZES.padding,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    maxHeight: '50%',
  },
  categoryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  categoryItemText: { ...FONTS.body3, textAlign: 'center' },
  footer: { paddingTop: SIZES.base * 2, borderTopWidth: 1 },
});
