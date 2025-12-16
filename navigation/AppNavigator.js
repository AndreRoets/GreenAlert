import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import CategorySetupScreen from '../screens/CategorySetupScreen';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import DisposableSetupScreen from '../screens/DisposableSetupScreen';
import LeftoverBudgetScreen from '../screens/LeftoverBudgetScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RecurringSpendsScreen from '../screens/RecurringSpendsScreen';
import DisposableDashboardScreen from '../screens/DisposableDashboardScreen';
import { loadFromStorage } from '../services/storage';

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

  useEffect(() => {
    const checkOnboarding = async () => {
      const session = await loadFromStorage('userSession');
      if (session && !session.isGuest) {
        const budgetData = await loadFromStorage('userBudget');
        const hasCompleted = await loadFromStorage('hasCompletedOnboarding');
        if (hasCompleted && budgetData?.viewPreference) {
          setInitialRoute('DisposableDashboard');
          return;
        }
        if (hasCompleted) {
          setInitialRoute('Dashboard');
        } else {
          setInitialRoute('Onboarding');
        }
      } else {
        setInitialRoute('Auth');
      }
    };

    checkOnboarding();
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
            backgroundColor: '#FFFFFF',
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
            borderBottomWidth: 2,
            borderBottomColor: '#EEEEEE',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CategorySetup" component={CategorySetupScreen} options={{ title: 'Setup Categories' }}/>
        <Stack.Screen name="DisposableSetup" component={DisposableSetupScreen} options={{ title: 'Disposable Income' }} />
        <Stack.Screen name="BudgetSetup" component={BudgetSetupScreen} options={{ title: 'Set Budget' }} />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={({ navigation }) => ({
            title: 'Dashboard',
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  })
                )}
                style={{ marginLeft: 15 }}
              >
                <Text style={{ color: '#000000', fontSize: 16 }}>Restart</Text>
              </TouchableOpacity>
            ),
            // --- Development Only ---
            headerRight: () => (
              <TouchableOpacity
                onPress={clearAsyncStorage}
                style={{ marginRight: 15 }}>
                <Text style={{ color: '#FF4136', fontSize: 16 }}>Clear</Text>
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
              <TouchableOpacity
                onPress={() => navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Auth' }],
                  })
                )}
                style={{ marginLeft: 15 }}
              >
                <Text style={{ color: '#000000', fontSize: 16 }}>Restart</Text>
              </TouchableOpacity>
            ),
            // --- Development Only ---
            headerRight: () => (
              <TouchableOpacity
                onPress={clearAsyncStorage}
                style={{ marginRight: 15 }}>
                <Text style={{ color: '#FF4136', fontSize: 16 }}>Clear</Text>
              </TouchableOpacity>
            ),
          })} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});