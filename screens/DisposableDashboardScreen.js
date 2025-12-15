import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';

export default function DisposableDashboardScreen({ route, navigation }) {
  const { budget: initialBudget } = route.params;
  const [budget, setBudget] = useState(initialBudget); // Allow budget to be updated with expenses
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', description: '' });

  // Memoize budget calculations to avoid re-running on every render
  const budgetDetails = useMemo(() => {
    if (!budget.paymentDay) {
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
      };
    }

    const calculateDaysLeft = () => {
      const today = new Date();
      const currentDay = today.getDate();
      let periodEndDate;
      if (currentDay < budget.paymentDay) {
        periodEndDate = new Date(today.getFullYear(), today.getMonth(), budget.paymentDay - 1);
      } else {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), budget.paymentDay - 1);
      }
      const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    const daysLeft = calculateDaysLeft();

    const spendableTotal = budget.total - (budget.savingsGoal || 0);
    const totalSavings = budget.savingsGoal || 0;

    // --- Daily View Logic ---
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
      if (budget.dailyBudgets && budget.dailyBudgets.length > 0) {
        dayFunMoneyBudget = budget.dailyBudgets[currentDay - 1] || 0;
      } else {
        dayFunMoneyBudget = daysLeft > 0 ? spendableTotal / daysLeft : 0;
      }

      const dailySavingsBudget = daysLeft > 0 ? totalSavings / daysLeft : 0;
      const funMoneyRemaining = dayFunMoneyBudget - totalSpends;
      const overspentAmount = funMoneyRemaining < 0 ? Math.abs(funMoneyRemaining) : 0;

      const finalFunMoney = Math.max(0, funMoneyRemaining);
      const finalDailySavings = dailySavingsBudget - overspentAmount;

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
      };
    }

    // --- Weekly View Logic ---
    if (budget.viewPreference === 'weekly') {
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

      // Calculate the weekly amount for each recurring spend and filter out any with no cost.
      const spendsToDisplay = (budget.recurringSpends || []).map(spend => ({
        ...spend,
        amount: spend.amount * (spend.daysPerWeek || 0),
      })).filter(spend => spend.amount > 0);

      const weekStartDate = new Date();
      weekStartDate.setDate(weekStartDate.getDate() + (currentWeek - 1) * 7);
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      const oneOffSpendsForWeek = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStartDate && expDate <= weekEndDate;
      });

      const oneOffTotal = oneOffSpendsForWeek.reduce((sum, exp) => sum + exp.amount, 0);

      const recurringTotal = spendsToDisplay.reduce((total, spend) => {
        return total + spend.amount;
      }, 0);

      const totalSpends = recurringTotal + oneOffTotal;

      let weekFunMoneyBudget;
      if (budget.weeklyBudgets && budget.weeklyBudgets.length > 0) {
        weekFunMoneyBudget = budget.weeklyBudgets[currentWeek - 1] || 0;
      } else {
        weekFunMoneyBudget = weeksLeft > 0 ? spendableTotal / weeksLeft : 0;
      }

      const weeklySavingsBudget = weeksLeft > 0 ? totalSavings / weeksLeft : 0;
      const funMoneyRemaining = weekFunMoneyBudget - totalSpends;
      const overspentAmount = funMoneyRemaining < 0 ? Math.abs(funMoneyRemaining) : 0;

      const finalFunMoney = Math.max(0, funMoneyRemaining);
      const finalWeeklySavings = weeklySavingsBudget - overspentAmount;

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
      };
    }

    // --- Fallback for no preference ---
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
    };
  }, [budget, currentDay, currentWeek, expenses]);

  const handleNextWeek = () => currentWeek < budgetDetails.weeksLeft && setCurrentWeek(currentWeek + 1);
  const handlePrevWeek = () => currentWeek > 1 && setCurrentWeek(currentWeek - 1);
  const handleNextDay = () => currentDay < budgetDetails.daysLeft && setCurrentDay(currentDay + 1);
  const handlePrevDay = () => currentDay > 1 && setCurrentDay(currentDay - 1);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate and format the date for the daily view
  const getDailyDateText = () => {
    const displayDate = new Date();
    displayDate.setDate(displayDate.getDate() + currentDay - 1);
    return formatDate(displayDate);
  };

  // Calculate and format the date range for the weekly view
  const getWeeklyDateText = () => {
    const today = new Date();
    const budgetEndDate = new Date();
    budgetEndDate.setDate(today.getDate() + budgetDetails.daysLeft - 1);

    const weekStartDate = new Date();
    weekStartDate.setDate(today.getDate() + (currentWeek - 1) * 7);

    const weekEndDate = new Date();
    weekEndDate.setDate(weekStartDate.getDate() + 6);

    return `${formatDate(weekStartDate)} - ${formatDate(weekEndDate > budgetEndDate ? budgetEndDate : weekEndDate)}`;
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
    // For weekly, we just use today's date, and it will be filtered into the correct week.

    const expenseToAdd = {
      id: Date.now(), // Simple unique ID
      amount: amount,
      description: newExpense.description,
      date: expenseDate.toISOString(),
    };

    setExpenses([...expenses, expenseToAdd]);
    setNewExpense({ amount: '', description: '' });
    setModalVisible(false);
  };

  const openAddExpenseModal = () => {
    // Reset form state when opening
    setNewExpense({ amount: '', description: '' });
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.label}>{budgetDetails.label}</Text>
        <Text style={[styles.amount, { color: budgetDetails.amount > 0 ? '#32CD32' : '#555' }]}>{budgetDetails.currency.symbol}{budgetDetails.amount.toFixed(2)}</Text>
        <Text style={styles.subAmount}>Remaining</Text>

        {budget.savingsGoal > 0 && (
          <View style={styles.savingsDisplay}>
            <Text style={styles.savingsLabel}>Savings This Period</Text>
            <Text style={[styles.savingsAmount, { color: budgetDetails.isSavingsNegative ? '#FF4136' : '#007AFF' }]}>{budgetDetails.currency.symbol}{budgetDetails.savingsForView.toFixed(2)}</Text>
          </View>
        )}

        {budgetDetails.isDaily && budgetDetails.daysLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevDay} disabled={currentDay === 1}>
              <Text style={[styles.arrow, currentDay === 1 && styles.arrowDisabled]}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.weekText}>{getDailyDateText()}</Text>
            <TouchableOpacity onPress={handleNextDay} disabled={currentDay === budgetDetails.daysLeft}>
              <Text style={[styles.arrow, currentDay === budgetDetails.daysLeft && styles.arrowDisabled]}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}
        {budgetDetails.isWeekly && budgetDetails.weeksLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevWeek} disabled={currentWeek === 1}>
              <Text style={[styles.arrow, currentWeek === 1 && styles.arrowDisabled]}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.weekText}>{getWeeklyDateText()}</Text>
            <TouchableOpacity onPress={handleNextWeek} disabled={currentWeek === budgetDetails.weeksLeft}>
              <Text style={[styles.arrow, currentWeek === budgetDetails.weeksLeft && styles.arrowDisabled]}>{'>'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView style={styles.expenseList}>
        {(budgetDetails.recurringSpendsForView.length > 0 || budgetDetails.oneOffSpendsForView.length > 0) && (
          <Text style={styles.expenseHeader}>Expected Recurring Spends</Text>
        )}

        {budgetDetails.recurringSpendsForView.map((spend, index) => (
          <View key={index} style={styles.expenseRow}>
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
              placeholder={`Amount (${budgetDetails.currency.symbol})`}
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

      <TouchableOpacity style={styles.button} onPress={openAddExpenseModal}>
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
  label: { fontSize: 24, fontWeight: 'bold', color: '#555555' },
  amount: {
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 10,
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
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
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