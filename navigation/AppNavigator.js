import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import CategorySetupScreen from '../screens/CategorySetupScreen';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import DisposableSetupScreen from '../screens/DisposableSetupScreen';
import DisposableCategorySetupScreen from '../screens/DisposableCategorySetupScreen';
import LeftoverBudgetScreen from '../screens/LeftoverBudgetScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RecurringSpendsScreen from '../screens/RecurringSpendsScreen';
import DisposableDashboardScreen from '../screens/DisposableDashboardScreen';
import { loadFromStorage, saveToStorage } from '../services/storage';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import UserProfileDrawer from '../screens/UserProfileDrawer';
import { registerForPushNotificationsAsync } from '../services/notificationService';
import { useNotificationTest } from '../contexts/NotificationTestContext';
import { useBudget } from '../contexts/BudgetContext';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator();

const clearAsyncStorage = async () => {
  try {
    await AsyncStorage.clear();
    Alert.alert('Storage Cleared', 'All data has been cleared. Please restart the app to see the changes.');
  } catch (e) {
    Alert.alert('Error', 'Failed to clear data.');
    console.error("Error clearing AsyncStorage:", e);
  }
};

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [isProfileDrawerVisible, setProfileDrawerVisible] = useState(false);
  const { testNotification } = useNotificationTest();
  const { theme } = useTheme();
  const { budgetDetails } = useBudget();
  const budgetDetailsRef = useRef(budgetDetails);

  useEffect(() => {
    budgetDetailsRef.current = budgetDetails;
  }, [budgetDetails]);

  useEffect(() => {
    // --- WORKAROUND FOR EXPO GO ---
    // This listens for the test pop-up trigger from our context
    if (testNotification) {
      console.log('Test pop-up triggered:', testNotification);
      const { title, body } = testNotification;
      Alert.alert(title, body, [{ text: 'OK' }]);
    }
  }, [testNotification]);

  useEffect(() => {
    // --- TESTING: SCHEDULE NOTIFICATION EVERY 2 MINUTES ---
    const interval = setInterval(async () => {
      const details = budgetDetailsRef.current;
      if (details) {
        const status = details.status || 'green';
        const amount = details.amount !== undefined ? details.amount.toFixed(2) : '0.00';
        const symbol = details.currency?.symbol || '$';

        let title = "Budget Status Update";
        let body = `Your budget is ${status}. Remaining: ${symbol}${amount}`;

        if (status === 'red') {
          title = "Budget Alert 🚨";
          body = `You are over budget! Remaining: ${symbol}${amount}`;
        } else if (status === 'yellow') {
          title = "Budget Warning ⚠️";
          body = `You are getting close to your limit. Remaining: ${symbol}${amount}`;
        } else {
          title = "Budget Update ✅";
          body = `You are on track! Remaining: ${symbol}${amount}`;
        }

        await Notifications.scheduleNotificationAsync({
          content: { title, body, data: { title, body } },
          trigger: null,
        });
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // --- REAL NOTIFICATION LISTENER ---
    // This will work correctly in a development build or standalone app.
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      console.log('Notification received in foreground listener:', notification); // Add this line
      Alert.alert(title, body, [{ text: 'OK' }]);
    });

    // Listener for when a user taps on a notification
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      // Here you could add logic to navigate to a specific screen if needed
      const { title, body } = response.notification.request.content;
      Alert.alert(title, body, [{ text: 'OK' }]);
    });

    return () => {
      foregroundSubscription.remove();
      backgroundSubscription.remove();
    };
  }, []);

  useEffect(() => {
    registerForPushNotificationsAsync();
    const checkInitialRoute = async () => {
      const session = await loadFromStorage('userSession');
      const hasCompletedOnboarding = await loadFromStorage('hasCompletedOnboarding');

      // If user is logged in and has completed onboarding, go to the correct dashboard
      if (session && !session.isGuest && hasCompletedOnboarding) {
        let budgetData = await loadFromStorage('userBudget');

        // --- BUDGET RESET LOGIC ---
        // Checks if we have entered a new pay cycle and resets the budget if so.
        if (budgetData && budgetData.payDay) {
          const now = new Date();
          const currentDay = now.getDate();
          const payDay = parseInt(budgetData.payDay, 10);

          // Determine the start date of the current cycle
          let cycleStartDate = new Date(now.getFullYear(), now.getMonth(), payDay);
          if (currentDay < payDay) {
            // If today is before pay day, we are still in the cycle that started last month
            cycleStartDate.setMonth(cycleStartDate.getMonth() - 1);
          }
          cycleStartDate.setHours(0, 0, 0, 0);

          const lastCycleStart = budgetData.lastCycleStart ? new Date(budgetData.lastCycleStart) : null;

          // If it's a new cycle (or first time tracking), reset.
          if (!lastCycleStart || cycleStartDate > lastCycleStart) {
            const nextPayDate = new Date(cycleStartDate);
            nextPayDate.setMonth(nextPayDate.getMonth() + 1);
            const daysInCycle = Math.round((nextPayDate - cycleStartDate) / (1000 * 60 * 60 * 24));
            const totalAmount = parseFloat(budgetData.totalBudget || budgetData.disposableIncome || 0);

            budgetData = {
              ...budgetData,
              spent: 0,
              lastCycleStart: cycleStartDate.toISOString(),
              dailyLimit: daysInCycle > 0 ? totalAmount / daysInCycle : 0,
              weeklyLimit: daysInCycle > 0 ? (totalAmount / daysInCycle) * 7 : 0,
            };
            // Log the reset for debugging purposes
            console.log('Budget reset triggered. New cycle start:', cycleStartDate);
            await saveToStorage('userBudget', budgetData);
          }
        }

        if (budgetData?.viewPreference) {
          setInitialRoute('DisposableDashboard');
        } else {
          setInitialRoute('Dashboard');
        }
      } else {
        // For new users, guests, or users who haven't finished onboarding, start at Auth.
        setInitialRoute('Auth');
      }
    };

    checkInitialRoute();
  }, []);

  if (!initialRoute) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.background,
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 2,
            borderBottomColor: theme.border || '#EEEEEE',
            height: 110,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
        }}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CategorySetup" component={CategorySetupScreen} options={{ title: 'Setup Categories' }}/>
        <Stack.Screen name="DisposableCategorySetup" component={DisposableCategorySetupScreen} options={{ title: 'Setup Categories' }} />
        <Stack.Screen name="DisposableSetup" component={DisposableSetupScreen} options={{ title: 'Disposable Income' }} />
        <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} options={{ title: 'Set Budget' }} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={({ navigation }) => ({
            title: 'Dashboard',
            headerLeft: () => (
              <TouchableOpacity onPress={() => setProfileDrawerVisible(true)} style={styles.profileButton}>
                <View style={styles.profileIconCircle} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  })
                )}
                style={{ marginRight: 15 }} >
                <Text style={{ color: theme.text, fontSize: 16 }}>Restart</Text>
              </TouchableOpacity>
            ),
          })} />
        <Stack.Screen name="LeftoverBudget" component={LeftoverBudgetScreen} options={{ title: 'Budget Leftovers' }} />
        <Stack.Screen name="RecurringSpends" component={RecurringSpendsScreen} options={{ title: 'Recurring Spends' }} />
        <Stack.Screen
          name="DisposableDashboard"
          component={DisposableDashboardScreen}
          options={({ navigation }) => ({
            title: 'Dashboard',
            headerLeft: () => (
              <TouchableOpacity onPress={() => setProfileDrawerVisible(true)} style={styles.profileButton}>
                <View style={styles.profileIconCircle} />
              </TouchableOpacity>
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  })
                )}
                style={{ marginRight: 15 }} >
                <Text style={{ color: theme.text, fontSize: 16 }}>Restart</Text>
              </TouchableOpacity>
            ),
          })} />
      </Stack.Navigator>
      <UserProfileDrawer
        isVisible={isProfileDrawerVisible}
        onClose={() => setProfileDrawerVisible(false)}
      />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileButton: {
    marginLeft: 15,
    padding: 5,
  },
  profileIconCircle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E0E0E0', // A light grey, you can change this
  },
});