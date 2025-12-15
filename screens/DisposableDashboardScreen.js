import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DisposableDashboardScreen({ route, navigation }) {
  const { budget } = route.params;

  const calculateDisplayBudget = () => {
    if (budget.viewPreference === 'weekly') {
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
      const diffTime = periodEndDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
      return {
        amount: budget.total / weeksLeft,
        label: 'Weekly Budget',
      };
    }
    return {
      amount: budget.total,
      label: 'Monthly Budget',
    };
  };

  const displayBudget = calculateDisplayBudget();

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.label}>{displayBudget.label}</Text>
        <Text style={styles.amount}>${displayBudget.amount.toFixed(2)}</Text>
        <Text style={styles.subAmount}>Remaining</Text>
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