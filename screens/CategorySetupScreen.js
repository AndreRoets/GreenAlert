import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, TextInput } from 'react-native';

const allCategories = [
  'Housing', 'Transport', 'Food', 'Bills & Subscriptions', 'Personal',
  'Health', 'Education', 'Lifestyle & Fun', 'Family & Dependents',
  'Financial', 'Gifts & Donations'
];

export default function CategorySetupScreen({ route, navigation }) {
  const { budgetPreference, isGuest, currency, existingBudget, existingCategories } = route.params;
  const [categories, setCategories] = useState({});
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    let categoryState = {};
    if (existingCategories && existingCategories.length > 0) {
      // If we are editing, load the saved categories
      const allSavedCategories = [...new Set([...existingCategories, ...Object.keys(existingBudget?.categoryBudgets || {})])];
      categoryState = allSavedCategories.reduce((acc, category) => {
        acc[category] = true; // Assume all saved categories are active
        return acc;
      }, {});
    } else {
      // Otherwise, start with the default set
      const initialCategories = allCategories; // This screen is only for the 'entire' budget flow now.
      categoryState = initialCategories.reduce((acc, category) => {
        acc[category] = true; // All categories are on by default
        return acc;
      }, {});
    }
    setCategories(categoryState);
  }, [budgetPreference]);

  const toggleCategory = (category) => {
    setCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAddCustomCategory = () => {
    if (!customCategory.trim()) {
      Alert.alert('Empty Category', 'Please enter a name for your custom category.');
      return;
    }

    const existingCategories = Object.keys(categories).map(c => c.toLowerCase());
    if (existingCategories.includes(customCategory.trim().toLowerCase())) {
      Alert.alert('Duplicate Category', `The category "${customCategory.trim()}" already exists.`);
      return;
    }

    const newCategoryName = customCategory.trim();
    setCategories(prev => ({ ...prev, [newCategoryName]: true }));
    setCustomCategory(''); // Clear input after adding
  };

  const handleDone = async () => {
    const activeCategories = Object.keys(categories).filter(cat => categories[cat]);
    if (activeCategories.length === 0) {
      Alert.alert("No Categories Selected", "Please select at least one category to track.");
      return;
    }
    if (budgetPreference === 'entire') {
      // Navigate to the next step to set budget amounts for these categories
      navigation.navigate('BudgetSetup', { activeCategories, isGuest, currency, existingBudget });
    } else {
      navigation.navigate('DisposableSetup', { activeCategories, isGuest, currency, existingBudget });
    }
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

      <View style={styles.customCategoryContainer}>
        <TextInput
          style={styles.customCategoryInput}
          placeholder="Add a custom category..."
          value={customCategory}
          onChangeText={setCustomCategory}
          onSubmitEditing={handleAddCustomCategory} // Allows adding by pressing return key
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomCategory}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

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
    marginTop: 10,
  },
  customCategoryContainer: {
    flexDirection: 'row',
    width: '90%',
    marginBottom: 20,
  },
  customCategoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  addButton: {
    backgroundColor: '#000000',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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