import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';

const defaultDisposableCategories = [
  'Food & Drinks', 'Transport', 'Personal & Lifestyle', 'Social & Gifts', 'Miscellaneous'
];

const getCategoryIcon = (category) => {
  const map = {
    'Food & Drinks': 'fast-food-outline', 'Transport': 'car-outline',
    'Personal & Lifestyle': 'person-outline', 'Social & Gifts': 'gift-outline',
    'Miscellaneous': 'apps-outline'
  };
  return map[category] || 'pricetag-outline';
};

export default function DisposableCategorySetupScreen({ route, navigation }) {
  const { isGuest, currency, budget, activeCategories: passedCategories } = route.params;
  const [categories, setCategories] = useState({});
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      // Use the categories passed from the previous screen, or the defaults if something went wrong.
      const initialCategories = passedCategories || defaultDisposableCategories;
      const categoryState = initialCategories.reduce((acc, category) => {
        acc[category] = true; // All categories are on by default
        return acc;
      }, {});
      setCategories(categoryState);
    };

    loadCategories();
  }, [passedCategories]);

  const toggleCategory = (category) => {
    setCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleAddCustomCategory = () => {
    if (!customCategory.trim()) {
      Alert.alert('Empty Category', 'Please enter a name for your custom category.');
      return;
    }

    const currentCategories = Object.keys(categories).map(c => c.toLowerCase());
    if (currentCategories.includes(customCategory.trim().toLowerCase())) {
      Alert.alert('Duplicate Category', `The category "${customCategory.trim()}" already exists.`);
      return;
    }

    const newCategoryName = customCategory.trim();
    setCategories(prev => ({ ...prev, [newCategoryName]: true }));
    setCustomCategory(''); // Clear input after adding
  };

  const handleDone = () => {
    const activeCategories = Object.keys(categories).filter(cat => categories[cat]);
    if (activeCategories.length === 0) {
      Alert.alert("No Categories Selected", "Please select at least one category to track.");
      return;
    }
    // Navigate to the next step to add recurring spends
    navigation.navigate('RecurringSpends', {
      activeCategories,
      isGuest,
      currency,
      budget, // Pass the budget data along
    });
  };

  const renderCategory = (category) => (
    <View key={category} style={[styles.categoryRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.categoryInfo}>
        <Ionicons name={getCategoryIcon(category)} size={22} color={COLORS.primary} style={{ marginRight: 15 }} />
        <AppText style={styles.categoryText}>{category}</AppText>
      </View>
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
      <AppText style={styles.body}>Select the categories for your disposable income. You can add your own.</AppText>

      <View style={styles.customCategoryContainer}>
        <AppInput
          style={StyleSheet.flatten([styles.customCategoryInput, { color: theme.text }])}
          placeholderTextColor={theme.textSecondary}
          placeholder="Add a custom category..."
          value={customCategory}
          onChangeText={setCustomCategory}
          onSubmitEditing={handleAddCustomCategory}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomCategory} disabled={!customCategory.trim()}>
          <AppText style={styles.addButtonText}>Add</AppText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        {Object.keys(categories).sort().map(renderCategory)}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Next" onPress={handleDone} />
      </View>
    </View>
  );
}

// Using styles from CategorySetupScreen for consistency
const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base },
  body: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding },
  categoryList: { flex: 1, width: '100%' },
  customCategoryContainer: { flexDirection: 'row', width: '100%', marginBottom: SIZES.padding },
  customCategoryInput: { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, marginRight: -1 },
  addButton: { backgroundColor: COLORS.primary, justifyContent: 'center', paddingHorizontal: 20, borderTopRightRadius: SIZES.radius, borderBottomRightRadius: SIZES.radius, height: 55 },
  addButtonText: { ...FONTS.h4, color: 'white', fontSize: 16 },
  categoryRow: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15,
    marginBottom: 10, borderRadius: SIZES.radius, borderWidth: 1
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: { ...FONTS.body3 },
  footer: { paddingTop: SIZES.base * 2, borderTopWidth: 1 },
});