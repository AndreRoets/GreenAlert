import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { saveToStorage } from '../services/storage'; // Assuming this service exists
import { disposableCategories } from './CategorySetupScreen';

export default function OnboardingScreen({ navigation, route }) {
  const { isGuest, currency } = route.params;
  const handleChoice = async (choice) => {
    await saveToStorage('userBudgetPreference', choice);

    if (choice === 'disposable') {
      // For disposable income, we skip category selection and use a default set.
      navigation.navigate('DisposableSetup', {
        activeCategories: disposableCategories,
        isGuest, currency
      });
    } else {
      // For the entire budget, the user needs to select categories.
      navigation.navigate('CategorySetup', { budgetPreference: choice, isGuest, currency });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome to GreenAlert</Text>
      <Text style={styles.subHeader}>Brutally honest, but motivating.</Text>
      <Text style={styles.body}>Let’s get real about your spending. How do you want to track your budget?</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => handleChoice('entire')}>
        <Text style={styles.buttonText}>Track Entire Budget</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => handleChoice('disposable')}>
        <Text style={styles.buttonText}>Track Disposable Income Only</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 20,
    color: '#555555',
    marginBottom: 40,
    textAlign: 'center',
  },
  body: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 20,
    width: '90%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});