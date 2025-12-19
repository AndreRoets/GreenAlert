import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { loadFromStorage } from '../services/storage';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';
import AppCard from './AppCard';

export default function DashboardScreen({ route, navigation }) {
  const [budgetData, setBudgetData] = useState(null);
  const [categories, setCategories] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  useEffect(() => {
    const fetchBudgetData = async () => {
      const session = await loadFromStorage('userSession');
      setIsGuest(session?.isGuest || true);

      // For guest mode, data is passed via params. Otherwise, load from storage.
      if (route.params?.isGuest) {
        setBudgetData(route.params.budgetData);
        // Categories aren't passed in guest mode for this flow, so we don't set them.
      } else {
        const data = await loadFromStorage('userBudget');
        const cats = await loadFromStorage('userCategories');
        console.log('Loaded budget data:', data);
        setBudgetData(data);
        setCategories(cats);
      }
      setLoading(false);
    };

    if (isFocused) {
      fetchBudgetData();
    }
  }, [isFocused]);

  const calculateDaysLeft = (paymentDay) => {
    if (!paymentDay) return 0;

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let periodEndDate;

    if (currentDay < paymentDay) {
      // Period ends this month
      periodEndDate = new Date(currentYear, currentMonth, paymentDay);
    } else {
      // Period ends next month
      const nextMonth = new Date(today);
      nextMonth.setMonth(currentMonth + 1);
      periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay);
    }
    // Set time to the end of the day to include the last day fully
    periodEndDate.setHours(23, 59, 59, 999);
    const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = budgetData ? calculateDaysLeft(budgetData.paymentDay) : 0;
  const budgetStatus = 'green'; // 'green', 'yellow', or 'red'

  const allocated = budgetData ? Object.values(budgetData.categoryBudgets).reduce((sum, val) => sum + val, 0) : 0;
  const totalBudget = budgetData ? budgetData.totalBudget : 0;
  const unallocated = totalBudget - allocated;

  const currency = budgetData?.currency || { symbol: '$', code: 'USD' };
  const statusColor = unallocated < 0 ? COLORS.error : COLORS.success;

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!budgetData) {
    return <View style={[styles.centered, { backgroundColor: theme.background }]}><AppText>No budget data found.</AppText></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppCard style={styles.summaryContainer}>
        <AppText style={styles.label}>Money Left Over</AppText>
        <AppText style={[styles.amount, { color: statusColor }]}>
          {currency.symbol}{unallocated.toFixed(2)}
        </AppText>
        <AppText style={styles.subAmount}>out of {currency.symbol}{totalBudget.toFixed(2)} total budget</AppText>
        <View style={[styles.daysLeftContainer, { backgroundColor: theme.background }]}>
          <AppText style={styles.daysLeft}>{daysLeft} Days Left</AppText>
        </View>
      </AppCard>

      <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
        <AppText style={styles.categoryHeader}>Category Breakdown</AppText>
        {Object.entries(budgetData.categoryBudgets).map(([name, amount]) => (
          <View key={name} style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
            <AppText style={styles.categoryName}>{name}</AppText>
            {/* TODO: Subtract expenses from amount */}
            <AppText style={styles.categoryAmount}>{currency.symbol}{amount.toFixed(2)}</AppText>
          </View>
        ))}
         {unallocated < 0 && (
          <View style={[styles.categoryRow, { borderBottomColor: theme.border }]}>
            <AppText style={[styles.categoryName, {color: COLORS.error}]}>Over-allocated</AppText>
            <AppText style={[styles.categoryAmount, {color: COLORS.error}]}>-{currency.symbol}{Math.abs(unallocated).toFixed(2)}</AppText>
          </View>
        )}
      </ScrollView>

      {unallocated > 0 && (
        <View style={styles.footer}>
          <AppButton title="Budget Leftover Money" onPress={() => navigation.navigate('LeftoverBudget', { unallocated, paymentDay: budgetData.paymentDay, activeCategories: categories, isGuest, currency })} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryContainer: { alignItems: 'center', marginBottom: SIZES.padding, },
  label: { ...FONTS.h4 },
  amount: { ...FONTS.h1, fontSize: 64, marginVertical: SIZES.base },
  subAmount: { ...FONTS.body3 },
  daysLeftContainer: {
    marginTop: SIZES.padding,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  daysLeft: { ...FONTS.h4 },
  categoryList: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: SIZES.base * 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  categoryName: { ...FONTS.body3 },
  categoryAmount: { ...FONTS.body3, fontWeight: 'bold' },
  footer: { paddingTop: SIZES.base * 2 },
});