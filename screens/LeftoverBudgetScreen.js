import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function LeftoverBudgetScreen({ route, navigation }) {
  const { unallocated, daysLeft } = route.params;
  const [view, setView] = useState(null); // 'weekly' or 'monthly'

  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7)); // Ensure at least 1 week to avoid division by zero
  const weeklyBudget = unallocated / weeksLeft;

  const handleSelectView = (selectedView) => {
    setView(selectedView);
  };

  // For now, this just navigates back. We can add saving logic later.
  const handleDone = () => {
    // TODO: Save the user's preference (weekly/monthly) for the dashboard view.
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Budget Your Leftover Money</Text>
      <Text style={styles.subHeader}>You have <Text style={styles.bold}>${unallocated.toFixed(2)}</Text> left for the next <Text style={styles.bold}>{daysLeft}</Text> days.</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={() => handleSelectView('monthly')}>
          <Text style={styles.optionText}>Budget Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => handleSelectView('weekly')}>
          <Text style={styles.optionText}>Budget Weekly</Text>
        </TouchableOpacity>
      </View>

      {view === 'monthly' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Your monthly fun money is:</Text>
          <Text style={styles.resultAmount}>${unallocated.toFixed(2)}</Text>
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
  optionText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
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