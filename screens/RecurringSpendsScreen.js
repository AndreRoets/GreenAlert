import React, { useState, useMemo } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert, useColorScheme, Platform
} from 'react-native';
import { saveToStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppCard from './AppCard';
import useCurrentDate from '../hooks/useCurrentDate';

const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function RecurringSpendsScreen({ route, navigation }) {
  const { budget, activeCategories, isGuest, currency } = route.params;
  const [recurringSpends, setRecurringSpends] = useState([]);
  const today = useCurrentDate();

  const daysInPeriod = useMemo(() => {
    if (budget.viewPreference !== 'daily') return [];

    const currentDay = today.getDate();
    let periodEndDate;
    if (currentDay < budget.paymentDay) {
      periodEndDate = new Date(today.getFullYear(), today.getMonth(), budget.paymentDay - 1);
    } else {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), budget.paymentDay - 1);
    }
    const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
    const numberOfDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return Array.from({ length: numberOfDays }, (_, i) => {
      const date = new Date(today.getTime());
      date.setDate(today.getDate() + i);
      return date;
    });
  }, [budget.paymentDay, budget.viewPreference, today]);

  const addSpend = () => {
    setRecurringSpends([...recurringSpends, {
      description: '',
      amount: '',
      // Default to first category
      category: activeCategories[0],
      selectedDays: budget.viewPreference === 'daily' ? { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false } : undefined,
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
        //  spend.id || `${Date.now()}-${Math.random()}`,
        amount: parseFloat(spend.amount) || 0,
        daysPerWeek: spend.daysPerWeek ? parseInt(spend.daysPerWeek, 10) || 0 : undefined,
      })),
    };

    if (!isGuest) {
      await saveToStorage('userBudget', finalBudget);
      // Save disposable categories to a separate key to avoid conflicts
      await saveToStorage('disposableUserCategories', activeCategories);
      await saveToStorage('hasCompletedOnboarding', true);
    }

    navigation.navigate('DisposableDashboard', { budget: finalBudget, categories: activeCategories });
  };

  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  const renderSpendItem = (spend, index) => (
    <AppCard key={index} style={styles.spendItem}>
      <TouchableOpacity onPress={() => removeSpend(index)} style={styles.removeButton}>
        <AppText style={styles.removeButtonText}>×</AppText>
      </TouchableOpacity>
      <AppInput
        style={styles.input}
        placeholder="Description (e.g., Coffee)"
        value={spend.description}
        onChangeText={(text) => updateSpend(index, 'description', text)}
      />
      <AppInput
        style={styles.input}
        placeholder={`Amount (${currency.symbol})`}
        keyboardType="numeric"
        value={spend.amount}
        onChangeText={(text) => updateSpend(index, 'amount', text)}
      />
      {/* A simple text input for category for now. A picker would be better. */}
      <AppInput
        style={styles.input}
        placeholder="Category"
        value={spend.category}
        onChangeText={(text) => updateSpend(index, 'category', text)}
      />

      {budget.viewPreference === 'daily' && (
        <View>
          <AppText style={styles.toggleLabel}>Apply on which days?</AppText>
          <View style={styles.calendarContainer}>
            {dayShortNames.map((dayName, dayIndex) => (
              <TouchableOpacity
                key={dayIndex}
                style={[styles.dayButton, spend.selectedDays[dayIndex] && styles.dayButtonSelected]}
                onPress={() => {
                  const newSelectedDays = { ...spend.selectedDays, [dayIndex]: !spend.selectedDays[dayIndex] };
                  updateSpend(index, 'selectedDays', newSelectedDays);
                }}
              >
                <AppText style={[styles.dayText, spend.selectedDays[dayIndex] && styles.dayTextSelected]}>
                  {dayName}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.dateGrid, { borderColor: theme.border }]}>
            {daysInPeriod.map((date, dateIndex) => (
              <TouchableOpacity key={dateIndex} style={[styles.dateCell, { borderColor: theme.border }, spend.selectedDays[date.getDay()] && styles.dateCellSelected]}>
                <AppText style={[styles.dateText, { color: theme.textSecondary }, spend.selectedDays[date.getDay()] && styles.dateTextSelected]}>
                  {date.getDate()}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {budget.viewPreference === 'weekly' && (
        <View style={styles.daysPerWeekRow}>
          <AppText style={styles.toggleLabel}>How many days per week?</AppText>
          <AppInput
            style={styles.daysInput}
            keyboardType="number-pad"
            value={spend.daysPerWeek}
            onChangeText={(text) => updateSpend(index, 'daysPerWeek', text)}
            maxLength={1}
          />
        </View>
      )}
    </AppCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText style={styles.header}>Expected Recurring Spends</AppText>
        <AppText style={styles.subHeader}>
          Log any recurring expenses you expect, like a daily coffee or weekly lunch. This will help you track your budget more accurately.
        </AppText>

        {recurringSpends.map(renderSpendItem)}

        <AppButton variant="secondary" title="+ Add Recurring Spend" onPress={addSpend} />
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton title="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  header: { ...FONTS.h2, textAlign: 'center', marginBottom: SIZES.base },
  subHeader: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding },
  spendItem: {
    marginBottom: SIZES.padding,
  },
  input: {
    marginBottom: SIZES.base * 2,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SIZES.base,
    marginBottom: SIZES.base,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  dayButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: { ...FONTS.body4, fontWeight: 'bold' },
  dayTextSelected: { color: 'white' },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SIZES.base,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dateCell: {
    width: '14.28%', // 100% / 7 days
    aspectRatio: 1, // Make it a square
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  dateCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dateText: {
    ...FONTS.body4,
  },
  dateTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  toggleLabel: { ...FONTS.body3, marginBottom: SIZES.base },
  daysPerWeekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  daysInput: {
    height: 45,
    borderWidth: 0,
    backgroundColor: 'transparent',
    textAlign: 'right',
    minWidth: 60,
    paddingHorizontal: 0,
  },
  removeButton: { position: 'absolute', top: SIZES.base, right: SIZES.base, padding: SIZES.base, zIndex: 1 },
  removeButtonText: { fontSize: 24, color: COLORS.error, fontWeight: 'bold' },
  footer: {
    paddingTop: SIZES.base * 2,
    borderTopWidth: 1,
  },
});