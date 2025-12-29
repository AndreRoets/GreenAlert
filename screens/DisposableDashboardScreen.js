import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet, TouchableOpacity, Animated,
  ScrollView, 
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadFromStorage, saveToStorage } from '../services/storage';
import { useBudget } from '../contexts/BudgetContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import AppCard from './AppCard';
import useCurrentDate from '../hooks/useCurrentDate';
import { useTheme } from '../contexts/ThemeContext';

const ProgressBar = ({ total, current, color }) => {
  // current is "remaining", so spent is total - current
  const spent = Math.max(0, total - current);
  const percentage = total > 0 ? Math.min(Math.max((spent / total) * 100, 0), 100) : 100;
  
  return (
    <View style={{ height: 10, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 5, width: '100%', overflow: 'hidden', marginVertical: 15 }}>
       <View style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, borderRadius: 5 }} />
    </View>
  )
};

const getCategoryIcon = (category) => {
  const map = {
    'Food & Drinks': 'fast-food',
    'Transport': 'car',
    'Personal & Lifestyle': 'person',
    'Social & Gifts': 'gift',
    'Miscellaneous': 'apps',
    'Housing': 'home',
    'Bills & Subscriptions': 'receipt',
    'Health': 'medkit',
    'Education': 'school',
    'Family & Dependents': 'people',
    'Financial': 'cash',
  };
  return map[category] || 'pricetag';
};

export default function DisposableDashboardScreen({ route, navigation }) {
  const [budget, setBudget] = useState(null);
  const [adjustedBudgets, setAdjustedBudgets] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(1);
  const [expenses, setExpenses] = useState([]);
  const [lastProcessedExpenseCount, setLastProcessedExpenseCount] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCalculatorVisible, setCalculatorVisible] = useState(false);
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', necessary: false, category: '' });
  const [isLoading, setIsLoading] = useState(true);
  const { setBudgetDetails } = useBudget();
  const [categories, setCategories] = useState([]);
  const today = useCurrentDate();
  const prevBudgetDetailsRef = useRef();
  const latestBudgetDetailsRef = useRef();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertConfig, setCustomAlertConfig] = useState({ title: '', message: '', statusColor: COLORS.success });

  const initializeBudget = useCallback(async () => {
    console.log("Initializing budget...");
    setIsLoading(true);
    let initialBudget;
    let initialCategories;

    if (route.params?.budget && route.params?.categories) {
      // Budget was passed via navigation (e.g., after setup)
      initialBudget = route.params.budget;
      initialCategories = route.params.categories;
    } else {
      // No params, load from storage (e.g., on app start)
      initialBudget = await loadFromStorage('userBudget');
      // Load the specific categories for the disposable budget
      initialCategories = await loadFromStorage('disposableUserCategories');
    }

    if (initialBudget) {
      setBudget(initialBudget);
      setAdjustedBudgets(initialBudget.dailyBudgets || initialBudget.weeklyBudgets || []);
    }
    if (initialCategories) {
      setCategories(initialCategories);
      // Set default category for new expenses
      setNewExpense(prev => ({ ...prev, category: initialCategories[0] || '' }));
    }

    const savedExpenses = await loadFromStorage('userExpenses');
    if (savedExpenses) {
      setExpenses(savedExpenses);
    }

    setIsLoading(false);
  }, [route.params?.budget, route.params?.categories]);

  useEffect(() => {
    initializeBudget();
  }, [initializeBudget]);

  const budgetDetails = useMemo(() => {
    if (!budget) {
      return {
        amount: 0,
        label: 'Loading...',
        currency: { symbol: '$' },
        recurringSpendsForView: [],
        status: 'green',
        oneOffSpendsForView: [],
        savingsForView: 0,
        overspentAmount: 0,
        statusColor: COLORS.success, // Default to green
      };
    }

    if (!budget.paymentDay) {
      return {
        amount: budget.total,
        label: 'Total Budget',
        isDaily: false,
        isWeekly: false,
        recurringSpendsForView: [],
        status: 'green',
        oneOffSpendsForView: [],
        savingsForView: 0,
        overspentAmount: 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        statusColor: COLORS.success,
      };
    }

    const calculateDaysLeft = () => {
      const currentDay = today.getDate();
      let periodEndDate;
      if (currentDay < budget.paymentDay) {
        periodEndDate = new Date(today.getFullYear(), today.getMonth(), budget.paymentDay);
      } else {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), budget.paymentDay);
      }
      // Set time to the end of the day to include the last day fully
      periodEndDate.setHours(23, 59, 59, 999);
      const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const daysLeft = calculateDaysLeft();

    const spendableTotal = budget.total - (budget.savingsGoal || 0);
    const totalSavings = budget.savingsGoal || 0;

    if (budget.viewPreference === 'daily') {
      const displayDate = new Date(today);
      displayDate.setDate(displayDate.getDate() + currentDay - 1);
      const dayOfWeek = displayDate.getDay(); // 0 for Sun, 1 for Mon, etc.

      const oneOffSpendsForDay = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getFullYear() === displayDate.getFullYear() &&
               expDate.getMonth() === displayDate.getMonth() &&
               expDate.getDate() === displayDate.getDate();
      }).map(e => ({...e, isConfirmed: true})); // Mark these as confirmed

      const potentialRecurringSpends = (budget.recurringSpends || []).filter(
        spend => spend.selectedDays && spend.selectedDays[dayOfWeek] && spend.amount > 0
      );

      // Filter out recurring spends that have already been confirmed for today
      const unconfirmedRecurringSpends = potentialRecurringSpends.filter(recSpend => 
        !oneOffSpendsForDay.some(confSpend => confSpend.recurringSpendId === recSpend.id)
      );

      const oneOffTotal = oneOffSpendsForDay.reduce((sum, exp) => sum + exp.amount, 0);
      // Total spends are now ONLY confirmed (one-off) expenses
      const totalSpends = oneOffTotal;

      let dayFunMoneyBudget;
      const currentBudgets = adjustedBudgets.length > 0 ? adjustedBudgets : budget.dailyBudgets;
      if (currentBudgets && currentBudgets.length > 0) {
        dayFunMoneyBudget = currentBudgets[currentDay - 1] || 0;
      } else {
        dayFunMoneyBudget = daysLeft > 0 ? spendableTotal / daysLeft : 0;
      }
      
      const dailySavingsBudget = daysLeft > 0 ? totalSavings / daysLeft : 0;
      const funMoneyRemaining = dayFunMoneyBudget - totalSpends;
      
      const finalFunMoney = funMoneyRemaining; // This is the value to display as remaining fun money
      const overspentAmount = finalFunMoney < 0 ? Math.abs(finalFunMoney) : 0;
      const finalDailySavings = dailySavingsBudget - overspentAmount;

      let status = 'green';
      let statusColor = COLORS.success; // green
      if (finalFunMoney < 0) {
        status = 'red';
        statusColor = COLORS.error; // red
      } else if (dayFunMoneyBudget > 0 && finalFunMoney <= dayFunMoneyBudget / 3) {
        statusColor = COLORS.warning; // yellow
        status = 'yellow';
      }

      return {
        amount: finalFunMoney,
        totalPeriodBudget: dayFunMoneyBudget,
        label: 'Daily Budget',
        daysLeft: daysLeft,
        isWeekly: false,
        isDaily: true,
        recurringSpendsForView: unconfirmedRecurringSpends, // Show only unconfirmed
        oneOffSpendsForView: oneOffSpendsForDay,
        savingsForView: finalDailySavings,
        isSavingsNegative: finalDailySavings < 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        overspentAmount: overspentAmount,
        status: status,
        statusColor: statusColor,
      };
    }

    const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));

    if (budget.viewPreference === 'weekly') {

      const weekStartDate = new Date(today);
      weekStartDate.setDate(today.getDate() + (currentWeek - 1) * 7);
      weekStartDate.setHours(0, 0, 0, 0);

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);
      weekEndDate.setHours(23, 59, 59, 999);

      const oneOffSpendsForWeek = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStartDate && expDate <= weekEndDate;
      }).map(e => ({...e, isConfirmed: true})); // Mark as confirmed

      const potentialRecurringSpends = (budget.recurringSpends || []).map(spend => ({
        ...spend,
        // Calculate the weekly amount for each recurring spend
        amount: spend.amount * (spend.daysPerWeek || 0),
      })).filter(spend => spend.amount > 0);

      // Filter out recurring spends that have already been confirmed for this week
      const unconfirmedRecurringSpends = potentialRecurringSpends.filter(recSpend => 
        !oneOffSpendsForWeek.some(confSpend => confSpend.recurringSpendId === recSpend.id)
      );

      const oneOffTotal = oneOffSpendsForWeek.reduce((sum, exp) => sum + exp.amount, 0);

      // Total spends are now ONLY confirmed (one-off) expenses
      const totalSpends = oneOffTotal;

      let weekFunMoneyBudget;
      const currentBudgets = adjustedBudgets.length > 0 ? adjustedBudgets : budget.weeklyBudgets;
      if (currentBudgets && currentBudgets.length > 0) {
        weekFunMoneyBudget = currentBudgets[currentWeek - 1] || 0;
      } else {
        weekFunMoneyBudget = weeksLeft > 0 ? spendableTotal / weeksLeft : 0;
      }

      const weeklySavingsBudget = weeksLeft > 0 ? totalSavings / weeksLeft : 0;
      const funMoneyRemaining = weekFunMoneyBudget - totalSpends;

      const finalFunMoney = funMoneyRemaining; // This is the value to display as remaining fun money
      const overspentAmount = finalFunMoney < 0 ? Math.abs(finalFunMoney) : 0;
      const finalWeeklySavings = weeklySavingsBudget - overspentAmount;

      let status = 'green';
      let statusColor = COLORS.success; // green
      if (finalFunMoney < 0) {
        status = 'red';
        statusColor = COLORS.error; // red
      } else if (weekFunMoneyBudget > 0 && finalFunMoney <= weekFunMoneyBudget / 3) {
        statusColor = COLORS.warning; // yellow
        status = 'yellow';
      }

      return {
        amount: finalFunMoney,
        totalPeriodBudget: weekFunMoneyBudget,
        label: 'Weekly Budget',
        weeksLeft: weeksLeft,
        isWeekly: true,
        isDaily: false,
        recurringSpendsForView: unconfirmedRecurringSpends, // Show only unconfirmed
        oneOffSpendsForView: oneOffSpendsForWeek,
        savingsForView: finalWeeklySavings,
        isSavingsNegative: finalWeeklySavings < 0,
        currency: budget.currency || { symbol: '$', code: 'USD' },
        overspentAmount: overspentAmount,
        status: status,
        statusColor: statusColor,
      };
    }

    return {
      amount: budget.total,
      totalPeriodBudget: budget.total,
      label: 'Total Budget',
      isWeekly: false,
      isDaily: false,
      recurringSpendsForView: [],
      status: 'green',
      oneOffSpendsForView: [],
      savingsForView: 0,
      isSavingsNegative: false,
      currency: budget.currency || { symbol: '$', code: 'USD' },
      statusColor: COLORS.success,
      overspentAmount: 0,
    };
  }, [budget, adjustedBudgets, currentDay, currentWeek, expenses, today]);

  const calculatorImpact = useMemo(() => {
    const amount = parseFloat(calculatorAmount);
    if (!amount || isNaN(amount)) return null;

    const currentRemaining = budgetDetails.amount;
    const newRemaining = currentRemaining - amount;

    if (newRemaining >= 0) {
      return {
        status: 'safe',
        remainingAfter: newRemaining
      };
    }

    const overspend = Math.abs(newRemaining);
    const periodsLeft = (budgetDetails.isDaily ? budgetDetails.daysLeft : budgetDetails.weeksLeft) - 1;

    if (periodsLeft <= 0) {
      return {
        status: 'warning',
        message: "This exceeds your current budget and there are no future periods left in this cycle to cover it."
      };
    }

    const deduction = overspend / periodsLeft;

    // Calculate new future budget (based on next period)
    const currentIndex = budgetDetails.isDaily ? currentDay - 1 : currentWeek - 1;
    const nextIndex = currentIndex + 1;
    let futureBudgetBase = 0;
    if (adjustedBudgets && adjustedBudgets.length > nextIndex) {
      futureBudgetBase = adjustedBudgets[nextIndex];
    }
    const newFutureBudget = Math.max(0, futureBudgetBase - deduction);
    
    return {
      status: 'danger',
      overspend,
      periodsLeft,
      deduction,
      newFutureBudget,
      periodType: budgetDetails.isDaily ? 'days' : 'weeks'
    };
  }, [calculatorAmount, budgetDetails, adjustedBudgets, currentDay, currentWeek]);

  useEffect(() => {
    const prevDetails = prevBudgetDetailsRef.current;
    const currentDetailsString = JSON.stringify(budgetDetails);
    if (currentDetailsString !== JSON.stringify(prevDetails)) {
      setBudgetDetails(budgetDetails);
      prevBudgetDetailsRef.current = budgetDetails;
    }
  }, [budgetDetails, setBudgetDetails]);

  useEffect(() => {
    latestBudgetDetailsRef.current = budgetDetails;
  }, [budgetDetails]);

  const handleCloseAlert = async () => {
    setCustomAlertVisible(false);
    await saveToStorage('lastAlertTimestamp', Date.now().toString());
  };

  useEffect(() => {
    if (isLoading || !budget) return;

    const checkAlert = async () => {
      if (customAlertVisible) return;

      const lastTimestampStr = await loadFromStorage('lastAlertTimestamp');
      const lastTimestamp = lastTimestampStr ? parseInt(lastTimestampStr, 10) : 0;
      const now = Date.now();

      if (now - lastTimestamp >= 3600000) {
        const currentDetails = latestBudgetDetailsRef.current;
        if (!currentDetails) return;

      const greenMessages = [
        "You're managing your money wisely — keep it going!",
        "Great control! Your spending is right where it should be.",
        "Nice work staying within your budget.",
        "You're in the safe zone. Smart financial choices!",
        "Your budget looks healthy this period.",
        "You're spending with intention — well done.",
        "Everything is balanced so far. Keep it steady.",
        "Your finances are behaving nicely this month.",
        "Strong discipline! You're still under budget.",
        "You're building good money habits — keep it up."
      ];

      const yellowMessages = [
        "You're approaching your limit — slow things down.",
        "Careful! Your budget is starting to feel the pressure.",
        "You're close to the edge — think before spending.",
        "Just a heads-up: spending is adding up quickly.",
        "You're nearly at your limit for this period.",
        "A little caution now can save you later.",
        "Your budget is tightening — plan your next expense.",
        "Almost there — only spend on what really matters.",
        "You're entering the danger zone. Stay mindful.",
        "This is a good time to pause and review expenses."
      ];

      const redMessages = [
        "You've gone over budget — time to hit the brakes.",
        "Spending has exceeded your limit this period.",
        "Your budget is officially stretched too far.",
        "You've crossed your spending limit — review needed.",
        "This period is over budget. Let's regroup.",
        "Time to pause spending and reassess priorities.",
        "Your budget needs attention — expenses are too high.",
        "Overspending detected. Adjustments recommended.",
        "You've exceeded your limit — recovery mode on.",
        "This period needs tighter control moving forward."
      ];

      const getRandomMessage = (arr) => arr[Math.floor(Math.random() * arr.length)];

      let title = "Budget Status";
      let message = getRandomMessage(greenMessages);
      let statusColor = COLORS.success;

        if (currentDetails.status === 'red') {
        title = "Budget Alert";
        message = getRandomMessage(redMessages);
        statusColor = COLORS.error;
        } else if (currentDetails.status === 'yellow') {
        title = "Budget Warning";
        message = getRandomMessage(yellowMessages);
        statusColor = COLORS.warning;
        }

      setCustomAlertConfig({ title, message, statusColor });
      setCustomAlertVisible(true);
      }
    };

    checkAlert();
    const reminderInterval = setInterval(checkAlert, 60000);

    return () => {
      clearInterval(reminderInterval);
    };
  }, [isLoading, budget, customAlertVisible]);

  useEffect(() => {
    if (!budget) return;

    const calculateDuration = () => {
      if (!budget || !budget.paymentDay) return { days: 0, weeks: 0 };
      const currentDayNum = today.getDate();
      let periodEndDate;
      if (currentDayNum < budget.paymentDay) {
        periodEndDate = new Date(today.getFullYear(), today.getMonth(), budget.paymentDay);
      } else {
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        periodEndDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), budget.paymentDay);
      }
      periodEndDate.setHours(23, 59, 59, 999);
      const diffTime = Math.max(0, periodEndDate.getTime() - today.getTime());
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { days, weeks: Math.max(1, Math.ceil(days / 7)) };
    };

    const { days, weeks } = calculateDuration();
    const isDaily = budget.viewPreference === 'daily';
    const isWeekly = budget.viewPreference === 'weekly';

    // 1. Initialize Base Budgets
    let newBudgets = [];
    if (isDaily) {
      if (budget.dailyBudgets && budget.dailyBudgets.length > 0) {
        newBudgets = [...budget.dailyBudgets];
      } else {
        const spendableTotal = budget.total - (budget.savingsGoal || 0);
        const count = days > 0 ? days : 1;
        newBudgets = Array(count).fill(spendableTotal / count);
      }
    } else if (isWeekly) {
      if (budget.weeklyBudgets && budget.weeklyBudgets.length > 0) {
        newBudgets = [...budget.weeklyBudgets];
      } else {
        const spendableTotal = budget.total - (budget.savingsGoal || 0);
        const count = weeks > 0 ? weeks : 1;
        newBudgets = Array(count).fill(spendableTotal / count);
      }
    }

    // 2. Calculate Overspending & Deductions
    const getIndex = (dateStr) => {
      const date = new Date(dateStr);
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      const diffTime = date.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (isDaily) return diffDays;
      if (isWeekly) return Math.floor(diffDays / 7);
      return -1;
    };

    const expensesByIndex = {};
    expenses.forEach((exp) => {
      const idx = getIndex(exp.date);
      if (idx >= 0 && idx < newBudgets.length) {
        expensesByIndex[idx] = (expensesByIndex[idx] || 0) + exp.amount;
      }
    });

    let currentOverspendDetected = false;
    let currentOverspendAmount = 0;

    for (let i = 0; i < newBudgets.length; i++) {
      const budgetForPeriod = newBudgets[i];
      const expensesForPeriod = expensesByIndex[i] || 0;

      if (expensesForPeriod > budgetForPeriod) {
        const overspent = expensesForPeriod - budgetForPeriod;

        const currentIndex = isDaily ? currentDay - 1 : currentWeek - 1;
        if (i === currentIndex) {
          currentOverspendDetected = true;
          currentOverspendAmount = overspent;
        }

        const remainingPeriods = newBudgets.length - (i + 1);
        if (remainingPeriods > 0) {
          const deduction = overspent / remainingPeriods;
          for (let j = i + 1; j < newBudgets.length; j++) {
            newBudgets[j] = Math.max(0, newBudgets[j] - deduction);
          }
        }
      }
    }

    setAdjustedBudgets(newBudgets);

    if (currentOverspendDetected && expenses.length > lastProcessedExpenseCount) {
        Alert.alert(
          "Budget Overspent",
          `You've overspent by ${budget.currency?.symbol || '$'}${currentOverspendAmount.toFixed(2)}. This will be deducted from your future budgets.`
        );
    }
    setLastProcessedExpenseCount(expenses.length);
  }, [
    expenses,
    budget,
    today.toDateString(),
    currentDay,
    currentWeek,
  ]);

  const handleNextWeek = () => currentWeek < budgetDetails.weeksLeft && setCurrentWeek(currentWeek + 1);
  const handlePrevWeek = () => currentWeek > 1 && setCurrentWeek(currentWeek - 1);
  const handleNextDay = () => currentDay < budgetDetails.daysLeft && setCurrentDay(currentDay + 1);
  const handlePrevDay = () => currentDay > 1 && setCurrentDay(currentDay - 1);

  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const getDailyDateText = () => {
    const displayDate = new Date(today);
    displayDate.setDate(displayDate.getDate() + currentDay - 1);
    return formatDate(displayDate);
  };

  const getWeeklyDateText = () => {
    const weekStartDate = new Date(today);
    weekStartDate.setDate(today.getDate() + (currentWeek - 1) * 7);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    return `${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}`;
  };

  const getMotivationalText = () => {
    const { amount, totalPeriodBudget } = budgetDetails;
    if (totalPeriodBudget === 0) return "No budget set.";
    const percentageLeft = (amount / totalPeriodBudget) * 100;

    if (amount < 0) return "Over budget. Time to stop spending.";
    if (percentageLeft < 20) return "Careful — nearing today’s limit.";
    if (percentageLeft < 50) return "You're managing well, keep it up.";
    if (percentageLeft >= 50) return "You’re on track 🎉";
    return "Stay in the green.";
  };

  const handleAddExpense = async () => {
    const amount = parseFloat(newExpense.amount);
    if (!amount || amount <= 0 || !newExpense.description || !newExpense.category) {
      Alert.alert('Invalid Expense', 'Please enter a valid amount, description, and category.');
      return;
    }
    let expenseDate = new Date(today);
    if (budget.viewPreference === 'daily') {
      expenseDate.setDate(expenseDate.getDate() + currentDay - 1);
    } else if (budget.viewPreference === 'weekly') {
      expenseDate.setDate(expenseDate.getDate() + (currentWeek - 1) * 7);
    }
    const updatedExpenses = [...expenses, { id: Date.now(), amount, description: newExpense.description, necessary: newExpense.necessary, category: newExpense.category, date: expenseDate.toISOString() }];
    setExpenses(updatedExpenses);
    await saveToStorage('userExpenses', updatedExpenses);
    setNewExpense({ amount: '', description: '', necessary: false, category: categories[0] || '' });
    setModalVisible(false);
  };

  const handleRemoveExpense = (expenseId) => {
    Alert.alert(
      "Remove Expense",
      "Are you sure you want to remove this expense?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: async () => {
            const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
            setExpenses(updatedExpenses);
            await saveToStorage('userExpenses', updatedExpenses);
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleConfirmRecurringSpend = async (spendToConfirm) => {
    let expenseDate = new Date(today);
    if (budget.viewPreference === 'daily') {
      expenseDate.setDate(expenseDate.getDate() + currentDay - 1);
    } else if (budget.viewPreference === 'weekly') {
      // For weekly, we can just use today's date within the current week
      expenseDate.setDate(today.getDate() + (currentWeek - 1) * 7);
    }

    const newExpense = {
      id: Date.now(),
      amount: spendToConfirm.amount,
      description: spendToConfirm.description,
      category: spendToConfirm.category,
      necessary: true, // Recurring spends are generally considered necessary/planned
      date: expenseDate.toISOString(),
      recurringSpendId: spendToConfirm.id, // Link back to the original recurring spend
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    await saveToStorage('userExpenses', updatedExpenses);
    Alert.alert(
      "Expense Confirmed",
      `"${spendToConfirm.description}" has been added to your spends for this period.`
    );
  };

  if (isLoading || !budget) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
      <AppCard style={styles.summaryContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText style={styles.label}>{budgetDetails.label}</AppText>
          <TouchableOpacity onPress={() => setCalculatorVisible(true)} style={{ marginLeft: 8, padding: 4 }}>
            <Ionicons name="calculator-outline" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        <AppText style={[styles.amount, { color: budgetDetails.statusColor }]}>{budgetDetails.currency.symbol}{budgetDetails.amount.toFixed(2)}</AppText>
        <AppText style={styles.subAmount}>{getMotivationalText()}</AppText>

        <ProgressBar total={budgetDetails.totalPeriodBudget} current={budgetDetails.amount} color={budgetDetails.statusColor} />

        {budget.savingsGoal > 0 && (
          <View style={[styles.savingsDisplay, { borderTopColor: theme.border }]}>
            <AppText style={styles.savingsLabel}>Savings This Period</AppText>
            <AppText style={[styles.savingsAmount, { color: budgetDetails.isSavingsNegative ? COLORS.error : COLORS.primary }]}>{budgetDetails.currency.symbol}{budgetDetails.savingsForView.toFixed(2)}</AppText>
          </View>
        )}

        {budgetDetails.isDaily && budgetDetails.daysLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevDay} disabled={currentDay <= 1}>
              <AppText style={[styles.arrow, currentDay <= 1 && styles.arrowDisabled]}>{'<'}</AppText>
            </TouchableOpacity>
            <AppText style={styles.weekText}>{getDailyDateText()}</AppText>
            <TouchableOpacity onPress={handleNextDay} disabled={!budgetDetails.daysLeft || currentDay >= budgetDetails.daysLeft}>
              <AppText style={[styles.arrow, (!budgetDetails.daysLeft || currentDay >= budgetDetails.daysLeft) && styles.arrowDisabled]}>{' >'}</AppText>
            </TouchableOpacity>
          </View>
        )}
        {budgetDetails.isWeekly && budgetDetails.weeksLeft > 1 && (
          <View style={styles.weekNavigator}>
            <TouchableOpacity onPress={handlePrevWeek} disabled={currentWeek <= 1}>
              <AppText style={[styles.arrow, currentWeek <= 1 && styles.arrowDisabled]}>{'<'}</AppText>
            </TouchableOpacity>
            <AppText style={styles.weekText}>{getWeeklyDateText()}</AppText>
            <TouchableOpacity onPress={handleNextWeek} disabled={!budgetDetails.weeksLeft || currentWeek >= budgetDetails.weeksLeft}>
              <AppText style={[styles.arrow, (!budgetDetails.weeksLeft || currentWeek >= budgetDetails.weeksLeft) && styles.arrowDisabled]}>{' >'}</AppText>
            </TouchableOpacity>
          </View>
        )}
      </AppCard>

      <ScrollView style={styles.expenseList} showsVerticalScrollIndicator={false}>
        {(budgetDetails.recurringSpendsForView.length > 0 || budgetDetails.oneOffSpendsForView.length > 0) && (
          <AppText style={styles.expenseHeader}>Spends This Period</AppText>
        )}

        {budgetDetails.recurringSpendsForView.map((spend, index) => (
          <TouchableOpacity key={`rec-${index}`} style={[styles.expenseRow, { borderBottomColor: theme.border }, styles.unconfirmedExpenseRow]} onPress={() => handleConfirmRecurringSpend(spend)}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(0,0,0,0.05)' }]}>
               <Ionicons name={getCategoryIcon(spend.category)} size={20} color={theme.textSecondary} />
            </View>
            <View style={styles.expenseDetails}>
              <AppText style={styles.expenseDescription}>{spend.description} (Tap to confirm)</AppText>
              <AppText style={styles.unconfirmedExpenseAmount}>-{budgetDetails.currency.symbol}{spend.amount.toFixed(2)}</AppText>
            </View>
          </TouchableOpacity>
        ))}

        {budgetDetails.oneOffSpendsForView.map((expense) => (
          <View key={expense.id} style={[styles.expenseRow, { borderBottomColor: theme.border }, !expense.necessary && styles.unnecessaryExpenseRow]}>
            <View style={[styles.iconContainer, { backgroundColor: expense.necessary ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)' }]}>
               <Ionicons name={getCategoryIcon(expense.category)} size={20} color={expense.necessary ? COLORS.success : COLORS.error} />
            </View>
            <View style={[styles.expenseDetails, {flex: 1}]}>
              <AppText style={styles.expenseDescription}>{expense.description}</AppText>
              <AppText style={styles.expenseAmount}>-{budgetDetails.currency.symbol}{expense.amount.toFixed(2)}</AppText>
            </View>
            <TouchableOpacity onPress={() => handleRemoveExpense(expense.id)} style={styles.removeExpenseButton}>
              <AppText style={styles.removeExpenseButtonText}>✕</AppText>
            </TouchableOpacity>
          </View>
        ))}

        {budgetDetails.recurringSpendsForView.length === 0 && budgetDetails.oneOffSpendsForView.length === 0 && (
          <View style={styles.placeholder}>
            <AppText style={{ color: theme.textSecondary }}>No spends for this period.</AppText>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, paddingBottom: SIZES.padding + insets.bottom }]}>
            <AppText style={styles.modalHeader}>Add Expense</AppText>
            <AppInput
              style={StyleSheet.flatten([styles.modalInput, { color: theme.text }])}
              placeholderTextColor={theme.textSecondary}
              placeholder={`Amount (${budgetDetails.currency?.symbol || '$'})`}
              keyboardType="numeric"
              value={newExpense.amount}
              onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
            />
            <AppInput
              style={StyleSheet.flatten([styles.modalInput, { color: theme.text }])}
              placeholderTextColor={theme.textSecondary}
              placeholder="Description (e.g., Lunch)"
              value={newExpense.description}
              onChangeText={(text) => setNewExpense({ ...newExpense, description: text })}
            />
            <TouchableOpacity style={[styles.categoryButton, { borderBottomColor: theme.border }]} onPress={() => setCategoryModalVisible(true)}>
              <AppText style={styles.categoryButtonText}>
                Category: {newExpense.category || 'Select...'}
              </AppText>
            </TouchableOpacity>
            <View style={styles.switchContainer}>
              <AppText style={styles.switchLabel}>Was this necessary?</AppText>
              <Switch
                trackColor={{ false: theme.border, true: COLORS.primary }}
                thumbColor={Platform.OS === 'android' ? COLORS.primary : ''}
                onValueChange={(value) => setNewExpense({ ...newExpense, necessary: value })}
                value={newExpense.necessary} />
            </View>
            <View style={styles.modalButtonContainer}>
              <AppButton
                style={styles.modalButton}
                variant="secondary"
                onPress={() => setModalVisible(false)}
                title="Cancel"
              />
              <AppButton
                style={styles.modalButton}
                onPress={handleAddExpense}
                title="Save"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={customAlertVisible}
        onRequestClose={handleCloseAlert}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContent, { backgroundColor: theme.card }]}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: (customAlertConfig.statusColor || COLORS.success) + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 15
            }}>
              <Ionicons name={customAlertConfig.statusColor === COLORS.success ? "checkmark-circle" : "alert-circle"} size={32} color={customAlertConfig.statusColor || COLORS.success} />
            </View>
            <AppText style={[styles.alertTitle, { color: customAlertConfig.statusColor || theme.text }]}>{customAlertConfig.title}</AppText>
            <AppText style={[styles.alertMessage, { color: theme.textSecondary }]}>
              {customAlertConfig.message}
            </AppText>
            <AppButton
              title="OK"
              onPress={handleCloseAlert}
              style={{ width: '100%', backgroundColor: customAlertConfig.statusColor || COLORS.primary }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCalculatorVisible}
        onRequestClose={() => setCalculatorVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, paddingBottom: SIZES.padding + insets.bottom }]}>
            <AppText style={styles.modalHeader}>Budget Impact Calculator</AppText>
            <AppText style={{textAlign: 'center', marginBottom: 15, color: theme.textSecondary}}>
              See how an expense affects your future budget.
            </AppText>
            
            <AppInput
              style={StyleSheet.flatten([styles.modalInput, { color: theme.text }])}
              placeholderTextColor={theme.textSecondary}
              placeholder={`Expense Amount (${budgetDetails.currency?.symbol || '$'})`}
              keyboardType="numeric"
              value={calculatorAmount}
              onChangeText={setCalculatorAmount}
              autoFocus={true}
            />

            {calculatorImpact && (
              <View style={[styles.impactContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                {calculatorImpact.status === 'safe' && (
                  <AppText style={{ color: COLORS.success, textAlign: 'center' }}>
                    You're good! You will still have {budgetDetails.currency?.symbol}{calculatorImpact.remainingAfter.toFixed(2)} left for this {budgetDetails.isDaily ? 'day' : 'week'}.
                  </AppText>
                )}
                {calculatorImpact.status === 'warning' && (
                  <AppText style={{ color: COLORS.error, textAlign: 'center' }}>
                    {calculatorImpact.message}
                  </AppText>
                )}
                {calculatorImpact.status === 'danger' && (
                  <View>
                    <AppText style={{ color: COLORS.error, textAlign: 'center', marginBottom: 5, fontWeight: 'bold' }}>
                      Over Budget by {budgetDetails.currency?.symbol}{calculatorImpact.overspend.toFixed(2)}
                    </AppText>
                    <AppText style={{ color: theme.text, textAlign: 'center' }}>
                      To cover this, your budget for the next {calculatorImpact.periodsLeft} {calculatorImpact.periodType} will be:
                    </AppText>
                    <AppText style={{ color: COLORS.error, textAlign: 'center', fontSize: 24, fontWeight: 'bold', marginTop: 5 }}>
                      {budgetDetails.currency?.symbol}{calculatorImpact.newFutureBudget.toFixed(2)} / {budgetDetails.isDaily ? 'day' : 'week'}
                    </AppText>
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalButtonContainer}>
              <AppButton
                style={{ width: '100%' }}
                onPress={() => {
                  setCalculatorVisible(false);
                  setCalculatorAmount('');
                }}
                title="Done"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.categoryModalContent, { backgroundColor: theme.card, paddingBottom: SIZES.padding + insets.bottom }]}>
            <AppText style={styles.modalHeader}>Select Category</AppText>
            <ScrollView>
              {categories.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.categoryItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setNewExpense({ ...newExpense, category: cat });
                    setCategoryModalVisible(false);
                  }}
                >
                  <AppText style={styles.categoryItemText}>{cat}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>


      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <AppButton 
          title="Add Expense" 
          onPress={() => setModalVisible(true)} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SIZES.padding },
  summaryContainer: { alignItems: 'center', marginBottom: SIZES.padding },
  savingsDisplay: {
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  savingsLabel: { ...FONTS.body3 },
  savingsAmount: { ...FONTS.h3 },
  label: { ...FONTS.h4, opacity: 0.7 },
  amount: { ...FONTS.h1, fontSize: 64, marginVertical: SIZES.base },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SIZES.padding,
    width: '70%',
  },
  arrow: { ...FONTS.h2, paddingHorizontal: SIZES.base },
  arrowDisabled: { opacity: 0.3 },
  weekText: { ...FONTS.h4 },
  subAmount: { ...FONTS.body3, marginBottom: SIZES.base, textAlign: 'center' },
  expenseList: { flex: 1, width: '100%' },
  expenseHeader: { ...FONTS.h4, marginBottom: SIZES.base * 2 },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  unnecessaryExpenseRow: { backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  unconfirmedExpenseRow: { backgroundColor: 'rgba(0, 168, 150, 0.1)' },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDescription: { ...FONTS.body3, flex: 1, marginLeft: 10 },
  expenseAmount: { ...FONTS.body3, fontWeight: 'bold', color: COLORS.error, marginLeft: SIZES.base },
  unconfirmedExpenseAmount: { ...FONTS.body3, fontWeight: 'bold', marginLeft: SIZES.base },
  removeExpenseButton: {
    marginLeft: SIZES.base * 2,
    padding: SIZES.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeExpenseButtonText: { // This will inherit color from AppText
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: SIZES.padding,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
  },
  modalHeader: { ...FONTS.h3, marginBottom: SIZES.padding, textAlign: 'center' },
  modalInput: { marginBottom: SIZES.base * 2 },
  categoryButton: {
    borderBottomWidth: 2,
    paddingVertical: 15,
    marginBottom: SIZES.padding,
  },
  categoryButtonText: { ...FONTS.body3 },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  switchLabel: { ...FONTS.body3, fontWeight: '500' },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { width: '48%', marginVertical: 0 },
  categoryModalContent: {
    padding: SIZES.padding,
    borderTopLeftRadius: SIZES.radius * 2,
    borderTopRightRadius: SIZES.radius * 2,
    maxHeight: '50%',
  },
  categoryItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  categoryItemText: { ...FONTS.body3, textAlign: 'center' },
  footer: { paddingTop: SIZES.base * 2, borderTopWidth: 1 },
  impactContainer: {
    padding: 15,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 20,
    marginTop: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: SIZES.padding,
  },
  alertContent: {
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    width: '100%',
  },
  alertTitle: {
    ...FONTS.h3,
    marginBottom: SIZES.base,
    textAlign: 'center',
  },
  alertMessage: {
    ...FONTS.body3,
    textAlign: 'center',
    marginBottom: SIZES.padding,
  },
});
