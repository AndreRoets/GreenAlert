import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';

const allCategories = [
  'Housing', 'Transport', 'Food', 'Bills & Subscriptions', 'Personal',
  'Health', 'Education', 'Lifestyle & Fun', 'Family & Dependents',
  'Financial', 'Gifts & Donations'
];

const disposableCategories = [
  'Lifestyle & Fun', 'Family & Dependents', 'Financial', 'Gifts & Donations'
];

export default function CategorySetupScreen({ route, navigation }) {
  const { budgetPreference } = route.params;
  const [categories, setCategories] = useState({});

  useEffect(() => {
    const initialCategories = budgetPreference === 'entire' ? allCategories : disposableCategories;
    const categoryState = initialCategories.reduce((acc, category) => {
      acc[category] = true; // All categories are on by default
      return acc;
    }, {});
    setCategories(categoryState);
  }, [budgetPreference]);

  const toggleCategory = (category) => {
    setCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleDone = async () => {
    const activeCategories = Object.keys(categories).filter(cat => categories[cat]);
    if (activeCategories.length === 0) {
      Alert.alert("No Categories Selected", "Please select at least one category to track.");
      return;
    }
    // Navigate to the next step to set budget amounts for these categories
    navigation.navigate('BudgetSetup', { activeCategories });
  };

  const renderCategory = (category) => (
    <View key={category} style={styles.categoryRow}>
      <Text style={styles.categoryText}>{category}</Text>
      <Switch
        trackColor={{ false: "#767577", true: "#32CD32" }}
        thumbColor={categories[category] ? "#f4f3f4" : "#f4f3f4"}
        onValueChange={() => toggleCategory(category)}
        value={categories[category]}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Categorize Your Spending</Text>
      <Text style={styles.body}>Select the categories you want to track. You can turn off any you don't need.</Text>

      <ScrollView style={styles.categoryList}>
        {Object.keys(categories).map(renderCategory)}
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleDone}>
        <Text style={styles.buttonText}>Done</Text>
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
    paddingTop: 20,
  },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 15, textAlign: 'center' },
  body: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 20, maxWidth: '90%' },
  categoryList: {
    flex: 1,
    width: '90%',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryText: {
    fontSize: 18,
  },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '90%', alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});