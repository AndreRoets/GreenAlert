import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import CategorySetupScreen from '../screens/CategorySetupScreen';
import BudgetSetupScreen from '../screens/BudgetSetupScreen';
import LeftoverBudgetScreen from '../screens/LeftoverBudgetScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { loadFromStorage } from '../services/storage';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasCompleted = await loadFromStorage('hasCompletedOnboarding');
      if (hasCompleted) {
        setInitialRoute('Dashboard');
      } else {
        setInitialRoute('Onboarding');
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
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CategorySetup" component={CategorySetupScreen} options={{ title: 'Setup Categories' }}/>
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
                    routes: [{ name: 'Onboarding' }],
                  })
                )}
                style={{ marginLeft: 15 }}
              >
                <Text style={{ color: '#000000', fontSize: 16 }}>Restart</Text>
              </TouchableOpacity>
            ),
          })} />
        <Stack.Screen name="LeftoverBudget" component={LeftoverBudgetScreen} options={{ title: 'Budget Leftovers' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});