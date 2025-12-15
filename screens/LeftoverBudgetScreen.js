import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { saveToStorage } from '../services/storage';

export default function LeftoverBudgetScreen({ route, navigation }) {
  const { unallocated, paymentDay, activeCategories, isGuest } = route.params;
  const [view, setView] = useState(null); // 'weekly' or 'monthly'

  const calculateDaysLeft = (payDay) => {
    if (!payDay) return 0;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let periodEndDate;
    if (currentDay < payDay) {
      periodEndDate = new Date(currentYear, currentMonth, payDay - 1);
    } else {
      const nextMonth = new Date(today);
      nextMonth.setMonth(currentMonth + 1);
      periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), payDay - 1);
    }
    const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysLeft = calculateDaysLeft(paymentDay);
  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  // Prevent division by zero if there are no days/weeks left
  const weeklyBudget = weeksLeft > 0 ? unallocated / weeksLeft : 0;
  const dailyBudget = daysLeft > 0 ? unallocated / daysLeft : 0;

  const handleSelectView = (selectedView) => {
    if (view === selectedView) {
      setView(null); // Allow un-selecting
    } else {
      setView(selectedView);
    }
  };

  const handleDone = async () => {
    if (!view) {
      Alert.alert("Selection Needed", "Please select a daily or weekly budget view.");
      return;
    }

    const budgetData = {
      total: unallocated,
      paymentDay: paymentDay,
      viewPreference: view,
    };

    if (!isGuest) {
      await saveToStorage('userBudget', budgetData);
      await saveToStorage('userCategories', activeCategories);
      await saveToStorage('hasCompletedOnboarding', true);
    }

    navigation.navigate('DisposableDashboard', { budget: budgetData });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Budget Your Leftover Money</Text>
      <Text style={styles.subHeader}>You have <Text style={styles.bold}>${unallocated.toFixed(2)}</Text> left for the next <Text style={styles.bold}>{daysLeft}</Text> days.</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.optionButton, view === 'daily' && styles.selectedOption]}
          onPress={() => handleSelectView('daily')}
        >
          <Text style={[styles.optionText, view === 'daily' && styles.selectedOptionText]}>Budget Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionButton, view === 'weekly' && styles.selectedOption]}
          onPress={() => handleSelectView('weekly')}
        >
          <Text style={[styles.optionText, view === 'weekly' && styles.selectedOptionText]}>Budget Weekly</Text>
        </TouchableOpacity>
      </View>

      {view === 'daily' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Your daily fun money is:</Text>
          <Text style={styles.resultAmount}>${dailyBudget.toFixed(2)}</Text>
          <Text style={styles.resultSubtext}>based on {daysLeft} day(s) left</Text>
        </View>
      )}

      {view === 'weekly' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Your weekly fun money is:</Text>
          <Text style={styles.resultAmount}>${weeklyBudget.toFixed(2)}</Text>
          <Text style={styles.resultSubtext}>based on {weeksLeft} week(s) left</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleDone}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20, alignItems: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 10, textAlign: 'center' },
  subHeader: { fontSize: 18, color: '#555', textAlign: 'center', marginBottom: 40 },
  bold: { fontWeight: 'bold', color: '#000000' },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 15,
    width: '45%',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  optionText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  selectedOptionText: { color: '#FFFFFF' },
  resultContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  resultLabel: { fontSize: 20, color: '#555', marginBottom: 10 },
  resultAmount: { fontSize: 60, fontWeight: 'bold', color: '#32CD32' },
  resultSubtext: { fontSize: 16, color: '#555', marginTop: 10 },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});