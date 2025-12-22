import React from 'react';
import * as Notifications from 'expo-notifications';
import AppNavigator from './navigation/AppNavigator.js';
import { NotificationTestProvider } from './contexts/NotificationTestContext.js';
import { BudgetProvider } from './contexts/BudgetContext.js';

// Set the notification handler at the top level of the app
// This ensures that the app knows how to handle notifications when it's in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // We want to handle the alert with a custom pop-up
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


export default function App() {
  return (
    <BudgetProvider>
      <NotificationTestProvider>
        <AppNavigator />
      </NotificationTestProvider>
    </BudgetProvider>
  );
}
