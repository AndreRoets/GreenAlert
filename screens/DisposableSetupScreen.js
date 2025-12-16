import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';

export default function DisposableSetupScreen({ route, navigation }) {
  const { activeCategories, isGuest, currency, existingBudget } = route.params;

  const [disposableIncome, setDisposableIncome] = useState(existingBudget?.total?.toString() || '');
  const [paymentDay, setPaymentDay] = useState(existingBudget?.paymentDay?.toString() || '');

  const handleIncomeChange = (amount) => {
    if (/^\d*\.?\d*$/.test(amount)) {
      setDisposableIncome(amount);
    }
  };

  const handlePaymentDayChange = (day) => {
    const dayNum = parseInt(day, 10);
    if (/^\d*$/.test(day) && (day === '' || (dayNum >= 1 && dayNum <= 31))) {
      setPaymentDay(day);
    }
  };

  const handleNext = () => {
    const total = parseFloat(disposableIncome) || 0;
    if (total <= 0) {
      Alert.alert("Invalid Amount", "Please enter an amount greater than zero.");
      return;
    }
    if (!paymentDay || parseInt(paymentDay, 10) <= 0) {
      Alert.alert("Invalid Date", "Please enter a valid payment day (1-31).");
      return;
    }

    // Pass the data to the next screen to choose weekly/monthly
    navigation.navigate('LeftoverBudget', {
      unallocated: total,
      paymentDay: parseInt(paymentDay, 10),
      activeCategories: activeCategories, // Pass categories along
      isGuest,
      currency,
      existingBudget, // Pass existing budget data along
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.scrollContainer}>
        <Text style={styles.header}>Disposable Income</Text>
        <Text style={styles.body}>Enter your total disposable income for the month and when you get paid.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Total Disposable Income</Text>
          <TextInput
            style={[styles.input, { fontSize: 24 }]}
            placeholder={`${currency.symbol}0.00`}
            keyboardType="numeric"
            value={disposableIncome}
            onChangeText={handleIncomeChange}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>When do you get paid?</Text>
          <TextInput
            style={styles.input}
            placeholder="Day of month (e.g., 15)"
            keyboardType="number-pad"
            value={paymentDay}
            onChangeText={handlePaymentDayChange}
            maxLength={2}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { padding: 20, flex: 1, justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 15, textAlign: 'center' },
  body: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 40, maxWidth: '90%', alignSelf: 'center' },
  inputGroup: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    fontSize: 18,
    paddingVertical: 10,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});