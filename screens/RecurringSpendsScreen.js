import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch
} from 'react-native';
import { saveToStorage } from '../services/storage';

export default function RecurringSpendsScreen({ route, navigation }) {
  const { budget, activeCategories, isGuest } = route.params;
  const [recurringSpends, setRecurringSpends] = useState([]);

  const addSpend = () => {
    setRecurringSpends([...recurringSpends, {
      description: '',
      amount: '',
      category: activeCategories[0], // Default to first category
      applyToAll: budget.viewPreference === 'daily' ? false : undefined,
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
        amount: parseFloat(spend.amount) || 0,
        daysPerWeek: spend.daysPerWeek ? parseInt(spend.daysPerWeek, 10) || 0 : undefined,
      })),
    };

    if (!isGuest) {
      await saveToStorage('userBudget', finalBudget);
      // These were saved in the previous screen, but we can re-save to be safe
      await saveToStorage('userCategories', activeCategories);
      await saveToStorage('hasCompletedOnboarding', true);
    }

    navigation.navigate('DisposableDashboard', { budget: finalBudget });
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
        placeholder="Amount ($)"
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
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Apply to all days</Text>
          <Switch
            value={spend.applyToAll}
            onValueChange={(value) => updateSpend(index, 'applyToAll', value)}
            trackColor={{ false: "#767577", true: "#32CD32" }}
          />
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
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
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