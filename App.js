import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './navigation/AppNavigator.js';
import { NotificationTestProvider } from './contexts/NotificationTestContext.js';
import { BudgetProvider } from './contexts/BudgetContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';

export default function App() {
  return (
    <SafeAreaProvider>
      <BudgetProvider>
        <NotificationTestProvider>
          <ThemeProvider>
            <AppNavigator />
          </ThemeProvider>
        </NotificationTestProvider>
      </BudgetProvider>
    </SafeAreaProvider>
  );
}
