import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch
} from 'react-native';
import { saveToStorage } from '../services/storage';

const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurringSpendsScreen({ route, navigation }) {
  const { budget, activeCategories, isGuest, currency } = route.params;
  const [recurringSpends, setRecurringSpends] = useState([]);

  const daysInPeriod = useMemo(() => {
    if (budget.viewPreference !== 'daily') return [];

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
    const numberOfDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return Array.from({ length: numberOfDays }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      return date;
    });
  }, [budget.paymentDay, budget.viewPreference]);

  const addSpend = () => {
    setRecurringSpends([...recurringSpends, {
      description: '',
      amount: '',
      // Default to first category
      category: activeCategories[0],
      selectedDays: budget.viewPreference === 'daily' ? { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false } : undefined,
      daysPerWeek: budget.viewPreference === 'weekly' ? '7' : undefined,
    }]);
  };

  const updateSpend = (index, field, value) => {
    const newSpends = [...recurringSpends];
    // Basic validation for numeric fields
    if ((field === 'amount' || field === 'daysPerWeek') && value && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    newSpends[index][field] = value;
    setRecurringSpends(newSpends);
  };

  const removeSpend = (index) => {
    const newSpends = recurringSpends.filter((_, i) => i !== index);
    setRecurringSpends(newSpends);
  };

  const handleDone = async () => {
    const finalBudget = {
      ...budget,
      recurringSpends: recurringSpends.map(spend => ({
        ...spend,
        // No longer need to handle applyToAll
        amount: parseFloat(spend.amount) || 0,
        daysPerWeek: spend.daysPerWeek ? parseInt(spend.daysPerWeek, 10) || 0 : undefined,
      })),
    };

    if (!isGuest) {
      await saveToStorage('userBudget', finalBudget);
      // Save disposable categories to a separate key to avoid conflicts
      await saveToStorage('disposableUserCategories', activeCategories);
      await saveToStorage('hasCompletedOnboarding', true);
    }

    navigation.navigate('DisposableDashboard', { budget: finalBudget, categories: activeCategories });
  };

  const renderSpendItem = (spend, index) => (
    <View key={index} style={styles.spendItem}>
      <TouchableOpacity onPress={() => removeSpend(index)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Description (e.g., Coffee)"
        value={spend.description}
        onChangeText={(text) => updateSpend(index, 'description', text)}
      />
      <TextInput
        style={styles.input}
        placeholder={`Amount (${currency.symbol})`}
        keyboardType="numeric"
        value={spend.amount}
        onChangeText={(text) => updateSpend(index, 'amount', text)}
      />
      {/* A simple text input for category for now. A picker would be better. */}
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={spend.category}
        onChangeText={(text) => updateSpend(index, 'category', text)}
      />

      {budget.viewPreference === 'daily' && (
        <View>
          <Text style={styles.toggleLabel}>Apply on which days?</Text>
          <View style={styles.calendarContainer}>
            {dayShortNames.map((dayName, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[styles.dayButton, spend.selectedDays[dayIndex] && styles.dayButtonSelected]}
                onPress={() => {
                  const newSelectedDays = { ...spend.selectedDays, [dayIndex]: !spend.selectedDays[dayIndex] };
                  updateSpend(index, 'selectedDays', newSelectedDays);
                }}
              >
                <Text style={[styles.dayText, spend.selectedDays[dayIndex] && styles.dayTextSelected]}>
                  {dayName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.dateGrid}>
            {daysInPeriod.map((date, dateIndex) => (
              <TouchableOpacity key={dateIndex} style={[styles.dateCell, spend.selectedDays[date.getDay()] && styles.dateCellSelected]}>
                <Text style={[styles.dateText, spend.selectedDays[date.getDay()] && styles.dateTextSelected]}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {budget.viewPreference === 'weekly' && (
        <View style={styles.daysPerWeekRow}>
          <Text style={styles.toggleLabel}>How many days per week?</Text>
          <TextInput
            style={styles.daysInput}
            keyboardType="number-pad"
            value={spend.daysPerWeek}
            onChangeText={(text) => updateSpend(index, 'daysPerWeek', text)}
            maxLength={1}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Expected Recurring Spends</Text>
        <Text style={styles.subHeader}>
          Log any recurring expenses you expect, like a daily coffee or weekly lunch. This will help you track your budget more accurately.
        </Text>

        {recurringSpends.map(renderSpendItem)}

        <TouchableOpacity style={styles.addButton} onPress={addSpend}>
          <Text style={styles.addButtonText}>+ Add Recurring Spend</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subHeader: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 30 },
  spendItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 15,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 5,
    marginBottom: 5,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  dayButtonSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dayText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  dayTextSelected: { color: '#FFFFFF' },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  dateCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1, // Make it a square
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  dateCellSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: '#DDDDDD',
  },
  dateText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  dateTextSelected: {
    color: '#000000',
    fontWeight: 'bold',
  },
  toggleLabel: { fontSize: 16 },
  daysPerWeekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  daysInput: {
    fontSize: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingVertical: 5,
    textAlign: 'right',
    minWidth: 50,
  },
  removeButton: { position: 'absolute', top: 10, right: 10, padding: 5 },
  removeButtonText: { fontSize: 20, color: '#FF4136', fontWeight: 'bold' },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  doneButton: { backgroundColor: '#000000', paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  doneButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});