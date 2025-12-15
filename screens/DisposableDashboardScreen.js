import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DisposableDashboardScreen({ route, navigation }) {
  const { budget } = route.params;
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);

  // Memoize budget calculations to avoid re-running on every render
  const budgetDetails = useMemo(() => {
    if (!budget.paymentDay) {
      return { amount: budget.total, label: 'Total Budget', isWeekly: false, isDaily: false };
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

    if (budget.viewPreference === 'weekly') {
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      return {
        amount: weeksLeft > 0 ? budget.total / weeksLeft : 0,
        label: 'Weekly Budget',
        weeksLeft: weeksLeft,
        isWeekly: true,
        isDaily: false,
      };
    }

    if (budget.viewPreference === 'daily') {
      return {
        amount: daysLeft > 0 ? budget.total / daysLeft : 0,
        label: 'Daily Budget',
        daysLeft: daysLeft,
        isWeekly: false,
        isDaily: true,
      };
    }

    return {
      amount: budget.total,
      label: 'Total Budget',
      isWeekly: false,
      isDaily: false,
    };
  }, [budget]);

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

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.label}>{budgetDetails.label}</Text>
        <Text style={styles.amount}>${budgetDetails.amount.toFixed(2)}</Text>
        <Text style={styles.subAmount}>Remaining</Text>
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

      <View style={styles.placeholder}>
        <Text style={{ color: '#888' }}>Expense list will go here</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => { /* TODO: Navigate to AddExpense */ }}>
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
  label: { fontSize: 24, fontWeight: 'bold', color: '#555555' },
  amount: {
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#32CD32',
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
  subAmount: { fontSize: 18, color: '#555555' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});