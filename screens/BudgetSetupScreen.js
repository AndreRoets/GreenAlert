import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { saveToStorage } from '../services/storage';

export default function BudgetSetupScreen({ route, navigation }) {
  const { activeCategories } = route.params;

  const [totalBudget, setTotalBudget] = useState('');
  const [categoryBudgets, setCategoryBudgets] = useState(
    activeCategories.reduce((acc, cat) => ({ ...acc, [cat]: '' }), {})
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

  const allocated = Object.values(categoryBudgets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const total = parseFloat(totalBudget) || 0;
  const remaining = total - allocated;

  const handleDone = async () => {
    if (total <= 0) {
      Alert.alert("Invalid Amount", "Please enter a total budget amount greater than zero.");
      return;
    }

    const budgetData = {
      totalBudget: total,
      categoryBudgets: Object.entries(categoryBudgets).reduce((acc, [key, value]) => ({ ...acc, [key]: parseFloat(value) || 0 }), {}),
    };

    await saveToStorage('userBudget', budgetData);
    await saveToStorage('userCategories', activeCategories);
    await saveToStorage('hasCompletedOnboarding', true);
    navigation.navigate('Dashboard');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Set Your Budget</Text>
        <Text style={styles.body}>Enter your total budget and assign an amount to each category.</Text>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Budget Amount</Text>
          <TextInput
            style={styles.totalInput}
            placeholder="$0.00"
            keyboardType="numeric"
            value={totalBudget}
            onChangeText={handleTotalBudgetChange}
          />
          <Text style={[styles.remainingText, { color: remaining < 0 ? '#FF4136' : '#32CD32' }]}>
            Remaining: ${remaining.toFixed(2)}
          </Text>
        </View>

        {activeCategories.map(category => (
          <View key={category} style={styles.categoryRow}>
            <Text style={styles.categoryText}>{category}</Text>
            <TextInput
              style={styles.categoryInput}
              placeholder="$0.00"
              keyboardType="numeric"
              value={categoryBudgets[category]}
              onChangeText={(text) => handleCategoryChange(category, text)}
            />
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleDone}>
          <Text style={styles.buttonText}>Finish Setup</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 15, textAlign: 'center' },
  body: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 20, maxWidth: '90%', alignSelf: 'center' },
  totalContainer: {
    marginBottom: 30,
    padding: 20,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  totalInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 10,
    textAlign: 'center',
    width: '100%',
  },
  remainingText: { fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryText: { fontSize: 18, flex: 1 },
  categoryInput: {
    fontSize: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingVertical: 5,
    textAlign: 'right',
    minWidth: 100,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});