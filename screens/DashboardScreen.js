import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { loadFromStorage } from '../services/storage';

export default function DashboardScreen({ route, navigation }) {
  const [budgetData, setBudgetData] = useState(null);
  const [categories, setCategories] = useState(null);
  const [isGuest, setIsGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchBudgetData = async () => {
      const session = await loadFromStorage('userSession');
      setIsGuest(session?.isGuest || true);

      // For guest mode, data is passed via params. Otherwise, load from storage.
      if (route.params?.budgetData) {
        setBudgetData(route.params.budgetData);
        // Categories aren't passed in guest mode for this flow, so we don't set them.
      } else {
        const data = await loadFromStorage('userBudget');
        const cats = await loadFromStorage('userCategories');
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
      periodEndDate = new Date(currentYear, currentMonth, paymentDay - 1);
    } else {
      // Period ends next month
      const nextMonth = new Date(today);
      nextMonth.setMonth(currentMonth + 1);
      periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), paymentDay - 1);
    }
    const diffTime = periodEndDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = budgetData ? calculateDaysLeft(budgetData.paymentDay) : 0;
  const budgetStatus = 'green'; // 'green', 'yellow', or 'red'

  const allocated = budgetData ? Object.values(budgetData.categoryBudgets).reduce((sum, val) => sum + val, 0) : 0;
  const totalBudget = budgetData ? budgetData.totalBudget : 0;
  const unallocated = totalBudget - allocated;

  const statusColor = {
    green: '#32CD32', // Intense Green
    yellow: '#FFD700', // Intense Yellow
    red: '#FF4136', // Intense Red
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (!budgetData) {
    return <View style={styles.centered}><Text>No budget data found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <Text style={styles.label}>Money Left Over</Text>
        <Text style={[styles.amount, { color: statusColor[budgetStatus] }]}>
          ${unallocated.toFixed(2)}
        </Text>
        <Text style={styles.subAmount}>out of ${totalBudget.toFixed(2)} total budget</Text>
        <Text style={styles.daysLeft}>{daysLeft} Days Left in Period</Text>
      </View>

      <ScrollView style={styles.categoryList}>
        <Text style={styles.categoryHeader}>Category Breakdown</Text>
        {Object.entries(budgetData.categoryBudgets).map(([name, amount]) => (
          <View key={name} style={styles.categoryRow}>
            <Text style={styles.categoryName}>{name}</Text>
            {/* TODO: Subtract expenses from amount */}
            <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
          </View>
        ))}
         {unallocated < 0 && (
          <View style={styles.categoryRow}>
            <Text style={[styles.categoryName, {color: statusColor.red}]}>Over-allocated</Text>
            <Text style={[styles.categoryAmount, {color: statusColor.red}]}>-${Math.abs(unallocated).toFixed(2)}</Text>
          </View>
        )}
      </ScrollView>

      {unallocated > 0 && (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LeftoverBudget', { unallocated, daysLeft, paymentDay: budgetData.paymentDay, activeCategories: categories, isGuest })}>
          <Text style={styles.buttonText}>Budget Leftover Money</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 0,
  },
  summaryContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
  },
  label: { fontSize: 20, fontWeight: 'bold', color: '#555555' },
  amount: {
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subAmount: { fontSize: 18, color: '#555555' },
  daysLeft: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  categoryList: {
    flex: 1,
    width: '100%',
    marginTop: 20,
  },
  categoryHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  categoryName: { fontSize: 18 },
  categoryAmount: { fontSize: 18, fontWeight: 'bold' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { backgroundColor: '#000000', paddingVertical: 15, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});