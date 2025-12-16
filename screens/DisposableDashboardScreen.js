import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text,
  StyleSheet, TouchableOpacity,
  ScrollView, 
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { loadFromStorage } from '../services/storage';

export default function DisposableDashboardScreen({ route, navigation }) {
  const [budget, setBudget] = useState(null);
  const [adjustedBudgets, setAdjustedBudgets] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [lastProcessedExpenseCount, setLastProcessedExpenseCount] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [lastWarningDate, setLastWarningDate] = useState(null);
  const [newExpense, setNewExpense] = useState({ amount: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeBudget = async () => {
      setIsLoading(true);
      let initialBudget;
      if (route.params?.budget) {
        // Budget was passed via navigation (e.g., after setup)
        initialBudget = route.params.budget;
      } else {
        // No params, load from storage (e.g., on app start)
        initialBudget = await loadFromStorage('userBudget');
      }

      if (initialBudget) {
        setBudget(initialBudget);
        setAdjustedBudgets(initialBudget.dailyBudgets || initialBudget.weeklyBudgets || []);
      }
      setIsLoading(false);
    };
    initializeBudget();
  }, [route.params?.budget]);

  const budgetDetails = useMemo(() => {
    if (!budget) {
      return {
        amount: 0,
        label: 'Loading...',
        currency: { symbol: '$' },
        recurringSpendsForView: [],
        oneOffSpendsForView: [],
        savingsForView: 0,
        overspentAmount: 0,
        statusColor: '#32CD32', // Default to green
      };
    }

    if (!budget.paymentDay) {
      return {
        amount: budget.total,
        label: 'Total Budget',
        isDaily: false,
        isWeekly: false,
        recurringSpendsForView: [],
        oneOffSpendsForView: [],
        savingsForView: 0,
        overspentAmount: 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        statusColor: '#32CD32',
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
      });
      const recurringSpendsForDay = (budget.recurringSpends || []).filter(
        spend => spend.selectedDays && spend.selectedDays[dayOfWeek]
      );
      const recurringTotal = recurringSpendsForDay.reduce((sum, spend) => sum + spend.amount, 0);

      const oneOffTotal = oneOffSpendsForDay.reduce((sum, exp) => sum + exp.amount, 0);
      const totalSpends = recurringTotal + oneOffTotal;

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

      let statusColor = '#32CD32'; // green
      if (finalFunMoney < 0) {
        statusColor = '#FF4136'; // red
      } else if (dayFunMoneyBudget > 0 && finalFunMoney <= dayFunMoneyBudget / 3) {
        statusColor = '#FFD700'; // yellow
      }

      return {
        amount: finalFunMoney,
        label: 'Daily Budget',
        daysLeft: daysLeft,
        isWeekly: false,
        isDaily: true,
        recurringSpendsForView: recurringSpendsForDay,
        oneOffSpendsForView: oneOffSpendsForDay,
        savingsForView: finalDailySavings,
        isSavingsNegative: finalDailySavings < 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        overspentAmount: overspentAmount,
        statusColor: statusColor,
      };
    }

    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

    if (budget.viewPreference === 'weekly') {
      // Calculate the weekly amount for each recurring spend and filter out any with no cost.
      const spendsToDisplay = (budget.recurringSpends || []).map(spend => ({
        ...spend,
        amount: spend.amount * (spend.daysPerWeek || 0),
      })).filter(spend => spend.amount > 0);

      const weekStartDate = new Date();
      weekStartDate.setDate(new Date().getDate() + (currentWeek - 1) * 7);
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      const oneOffSpendsForWeek = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStartDate && expDate <= weekEndDate;
      });

      const oneOffTotal = oneOffSpendsForWeek.reduce((sum, exp) => sum + exp.amount, 0);

      const recurringTotal = spendsToDisplay.reduce((total, spend) => total + spend.amount, 0);

      const totalSpends = recurringTotal + oneOffTotal;

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

      let statusColor = '#32CD32'; // green
      if (finalFunMoney < 0) {
        statusColor = '#FF4136'; // red
      } else if (weekFunMoneyBudget > 0 && finalFunMoney <= weekFunMoneyBudget / 3) {
        statusColor = '#FFD700'; // yellow
      }

      return {
        amount: finalFunMoney,
        label: 'Weekly Budget',
        weeksLeft: weeksLeft,
        isWeekly: true,
        isDaily: false,
        recurringSpendsForView: spendsToDisplay,
        oneOffSpendsForView: oneOffSpendsForWeek,
        savingsForView: finalWeeklySavings,
        isSavingsNegative: finalWeeklySavings < 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        overspentAmount: overspentAmount,
        statusColor: statusColor,
      };
    }

    return {
      amount: budget.total,
      label: 'Total Budget',
      isWeekly: false,
      isDaily: false,
      recurringSpendsForView: [],
      oneOffSpendsForView: [],
      savingsForView: 0,
      isSavingsNegative: false,
      currency: budget.currency || { symbol: '$', code: 'USD' },
      statusColor: '#32CD32',
      overspentAmount: 0,
    };
  }, [budget, adjustedBudgets, currentDay, currentWeek, expenses]);

  useEffect(() => {
    if (budgetDetails.statusColor === '#FFD700') {
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

      let newAdjustedBudgets = [...adjustedBudgets];

      if (newAdjustedBudgets.length === 0) {
          const spendableTotal = budget.total - (budget.savingsGoal || 0);
          if (isDaily && daysLeft > 0) {
              const dailyAverage = spendableTotal / daysLeft;
              newAdjustedBudgets = Array(daysLeft).fill(dailyAverage);
          } else if (isWeekly && weeksLeft > 0) {
              const weeklyAverage = spendableTotal / weeksLeft;
              newAdjustedBudgets = Array(weeksLeft).fill(weeklyAverage);
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
    if (!amount || amount <= 0 || !newExpense.description) {
      Alert.alert('Invalid Expense', 'Please enter a valid amount and description.');
      return;
    }
    let expenseDate = new Date();
    if (budget.viewPreference === 'daily') {
      expenseDate.setDate(expenseDate.getDate() + currentDay - 1);
    }
    setExpenses([...expenses, { id: Date.now(), amount, description: newExpense.description, date: expenseDate.toISOString() }]);
    setNewExpense({ amount: '', description: '' });
    setModalVisible(false);
  };

  if (isLoading || !budget) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.label}>{budgetDetails.label}</Text>
        <Text style={[styles.amount, { color: budgetDetails.statusColor }]}>{budgetDetails.currency.symbol}{budgetDetails.amount.toFixed(2)}</Text>
        <Text style={styles.subAmount}>Remaining</Text>

        {budget.savingsGoal > 0 && (
          <View style={styles.savingsDisplay}>
            <Text style={styles.savingsLabel}>Savings This Period</Text>
            <Text style={[styles.savingsAmount, { color: budgetDetails.isSavingsNegative ? '#FF4136' : '#007AFF' }]}>{budgetDetails.currency.symbol}{budgetDetails.savingsForView.toFixed(2)}</Text>
          </View>
        )}

        {budgetDetails.isDaily && budgetDetails.daysLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevDay} disabled={currentDay <= 1}>
              <Text style={[styles.arrow, currentDay <= 1 && styles.arrowDisabled]}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.weekText}>{getDailyDateText()}</Text>
            <TouchableOpacity onPress={handleNextDay} disabled={!budgetDetails.daysLeft || currentDay >= budgetDetails.daysLeft}>
              <Text style={[styles.arrow, (!budgetDetails.daysLeft || currentDay >= budgetDetails.daysLeft) && styles.arrowDisabled]}>{' >'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {budgetDetails.isWeekly && budgetDetails.weeksLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevWeek} disabled={currentWeek <= 1}>
              <Text style={[styles.arrow, currentWeek <= 1 && styles.arrowDisabled]}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.weekText}>{getWeeklyDateText()}</Text>
            <TouchableOpacity onPress={handleNextWeek} disabled={!budgetDetails.weeksLeft || currentWeek >= budgetDetails.weeksLeft}>
              <Text style={[styles.arrow, (!budgetDetails.weeksLeft || currentWeek >= budgetDetails.weeksLeft) && styles.arrowDisabled]}>{' >'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.expenseList}>
        {(budgetDetails.recurringSpendsForView.length > 0 || budgetDetails.oneOffSpendsForView.length > 0) && (
          <Text style={styles.expenseHeader}>Spends This Period</Text>
        )}

        {budgetDetails.recurringSpendsForView.map((spend, index) => (
          <View key={`rec-${index}`} style={styles.expenseRow}>
            <Text style={styles.expenseDescription}>{spend.description}</Text>
            <Text style={styles.expenseAmount}>-{budgetDetails.currency.symbol}{spend.amount.toFixed(2)}</Text>
          </View>
        ))}

        {budgetDetails.oneOffSpendsForView.map((expense) => (
          <View key={expense.id} style={styles.expenseRow}>
            <Text style={styles.expenseDescription}>{expense.description}</Text>
            <Text style={styles.expenseAmount}>-{budgetDetails.currency.symbol}{expense.amount.toFixed(2)}</Text>
          </View>
        ))}

        {budgetDetails.recurringSpendsForView.length === 0 && budgetDetails.oneOffSpendsForView.length === 0 && (
          <View style={styles.placeholder}>
            <Text style={{ color: '#888' }}>No spends for this period.</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Add Expense</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={`Amount (${budgetDetails.currency?.symbol || '$'})`}
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Description (e.g., Lunch)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddExpense}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  summaryContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    marginBottom: 20,
  },
  savingsDisplay: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    alignItems: 'center',
  },
  savingsLabel: {
    fontSize: 16,
    color: '#555',
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#555555',
  },
  amount: {
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 20,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    width: '60%',
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: 10,
  },
  arrowDisabled: {
    color: '#CCCCCC',
  },
  weekText: {
    fontSize: 18,
    color: '#555',
  },
  subAmount: { fontSize: 18, color: '#555555', marginBottom: 10 },
  expenseList: {
    flex: 1,
    width: '100%',
  },
  expenseHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  expenseDescription: { fontSize: 16 },
  expenseAmount: { fontSize: 16, fontWeight: 'bold', color: '#FF4136' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    fontSize: 18,
    paddingVertical: 10,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    paddingVertical: 15,
    width: '48%',
    alignItems: 'center',
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#000000',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  cancelButtonText: {
    color: '#000000',
  },
});
