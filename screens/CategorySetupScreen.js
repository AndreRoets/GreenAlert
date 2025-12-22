import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';

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
      <AppText style={styles.categoryText}>{category}</AppText>
      <Switch
        trackColor={{ false: theme.border, true: COLORS.primary }}
        thumbColor={Platform.OS === 'android' ? COLORS.primary : ''}
        onValueChange={() => toggleCategory(category)}
        value={categories[category]}
      />
    </View>
  );

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
      <AppText style={styles.header}>Categorize Your Spending</AppText>
      <AppText style={styles.body}>Select the categories you want to track. You can turn off any you don't need.</AppText>

      <View style={styles.customCategoryContainer}>
        <AppInput
          style={StyleSheet.flatten([styles.customCategoryInput, { color: theme.text }])}
          placeholderTextColor={theme.textSecondary}
          placeholder="Add a custom category..."
          value={customCategory}
          onChangeText={setCustomCategory}
          onSubmitEditing={handleAddCustomCategory} // Allows adding by pressing return key
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomCategory} disabled={!customCategory.trim()}>
          <AppText style={styles.addButtonText}>Add</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {Object.keys(categories).map(renderCategory)}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.padding,
  },
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base },
  body: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding },
  categoryList: { flex: 1, width: '100%' },
  customCategoryContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: SIZES.padding,
  },
  customCategoryInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    marginRight: -1, // Overlap borders
  },
  addButton: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderTopRightRadius: SIZES.radius,
    borderBottomRightRadius: SIZES.radius,
    height: 55,
  },
  addButtonText: {
    ...FONTS.h4,
    color: 'white',
    fontSize: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  categoryText: {
    ...FONTS.body3,
  },
  footer: {
    paddingTop: SIZES.base * 2,
    borderTopWidth: 1,
  },
});