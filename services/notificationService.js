import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const messages = {
  green: [
    "You’re in control. Nice work — your spending is under control.",
    "You’re staying within your limits. Keep going.",
    "All good so far. Your budget looks healthy.",
    "You’re managing your money well today.",
    "Still on track. Future you will appreciate this.",
    "No red flags — just smart spending.",
    "You’ve got room to breathe financially.",
    "Strong discipline. Your budget is holding.",
    "You’re spending intentionally. That matters.",
    "Green zone — stay steady.",
  ],
  yellow: [
    "Pay attention. You’re getting close to your limit. Slow down.",
    "Heads up — your budget is tightening.",
    "This is manageable, but be mindful.",
    "Careful now — spending is picking up.",
    "You’re approaching the edge of your comfort zone.",
    "A few more expenses could push this over.",
    "Pause and check if this is necessary.",
    "Still okay, but not for long.",
    "This is your warning, not your failure.",
    "You’re in control — just need awareness.",
  ],
  red: [
    "Be honest with yourself. You’re over budget. It’s time to stop spending here.",
    "This category has crossed the limit.",
    "Ignoring this won’t make it better.",
    "You’ve spent more than you planned.",
    "This needs attention now.",
    "Reality check — this is unsustainable.",
    "Future stress starts here if this continues.",
    "This category is officially out of control.",
    "No judgment — but this must change.",
    "You can recover, but only if you act.",
  ],
};

const titles = {
    green: "✅ You're in control",
    yellow: "🟡 Pay attention",
    red: "🔴 Be honest with yourself",
};

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return true;
}

export const getRandomMessage = (status) => {
  const statusMessages = messages[status];
  if (!statusMessages || statusMessages.length === 0) return { title: "Budget Update", body: "Check your budget." };
  const randomIndex = Math.floor(Math.random() * statusMessages.length);
  return {
      title: titles[status],
      body: statusMessages[randomIndex]
  };
};

export const scheduleBudgetNotifications = async (status) => {
    // First, cancel any pending notifications to avoid duplicates or outdated messages
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule 2 notifications for the next 8 hours
    for (let i = 0; i < 2; i++) {
        const { title, body } = getRandomMessage(status);
        // Random time between 1 hour and 8 hours from now
        const randomSeconds = 3600 + Math.random() * (8 * 3600 - 3600);

        await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: { seconds: randomSeconds },
        });
    }
    console.log(`Scheduled 2 notifications for status: ${status}`);
};