import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

export default function AddExpenseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Expense</Text>
      <Text style={styles.subHeader}>Be intentional. Is this expense truly necessary?</Text>

      {/* Placeholder for form inputs */}
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Amount ($)" placeholderTextColor="#777777" keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Description (e.g., Coffee)" placeholderTextColor="#777777" />
        <Text style={styles.riskLabel}>Assess The Risk:</Text>
        {/* Placeholder for risk buttons */}
        <View style={styles.riskButtons}>
            <Text style={{color: '#888'}}>Risk assessment buttons here</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Log Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 10, textAlign: 'center' },
  subHeader: { fontSize: 16, color: '#555', textAlign: 'center', marginBottom: 40 },
  form: { flex: 1 },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    fontSize: 18,
    paddingVertical: 10,
    marginBottom: 25,
  },
  riskLabel: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginTop: 20 },
  riskButtons: { marginTop: 10, alignItems: 'center' },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});