import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { loadFromStorage } from '../services/storage';
import { useNotificationTest } from '../contexts/NotificationTestContext';
import { getRandomMessage } from '../services/notificationService';
import { useBudget } from '../contexts/BudgetContext';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AppText from '../components/AppText';
import AppButton from '../components/AppButton';

export default function UserProfileDrawer({ isVisible, onClose }) {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { triggerTestNotification } = useNotificationTest();
  const { budgetDetails } = useBudget();

  const colorScheme = useColorScheme();
  const theme = COLORS[colorScheme];

  useEffect(() => {
    const fetchUserData = async () => {
      if (isVisible) {
        setLoading(true);
        const session = await loadFromStorage('userSession');
        if (session && !session.isGuest) {
          // In a real app, you might fetch this from an API using session.userId
          // For now, we assume it was saved during profile setup.
          const profile = await loadFromStorage('currentUser');
          setUser(profile);
        } else {
          setUser({ firstName: 'Guest', lastName: 'User', email: 'No email' });
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isVisible]);

  const handleTestNotification = () => {
    // Use the status from the shared budget context. Default to 'green' if not available.
    const currentStatus = budgetDetails?.status || 'green';

    console.log(`Triggering test pop-up for current status: '${currentStatus}'...`);
    const message = getRandomMessage(currentStatus);
    triggerTestNotification(message);

    // Give feedback that the button was pressed
    Alert.alert("Test Notification Sent", `A test pop-up for your current '${currentStatus}' status has been triggered.`);

    // We don't close the drawer, so the user can see the pop-up
    // onClose(); 
  };

  const handleGoToSetup = async () => {
    onClose(); // Close the drawer first
    try {
      const session = await loadFromStorage('userSession');
      const budgetPreference = await loadFromStorage('userBudgetPreference');
      // Load existing budget and categories to allow editing
      const existingBudget = await loadFromStorage('userBudget');
      const existingDisposableCategories = await loadFromStorage('disposableUserCategories');
      const existingCategories = await loadFromStorage('userCategories');

      if (!session || !budgetPreference) {
        Alert.alert("Error", "Could not retrieve setup information. Please try restarting the app.");
        return;
      }

      if (budgetPreference === 'entire') {
        // If they track the entire budget, go to category setup
        navigation.navigate('CategorySetup', {
          budgetPreference: budgetPreference,
          isGuest: session.isGuest,
          currency: session.currency,
          existingBudget: existingBudget,
          existingCategories: existingCategories,
        });
      } else { // 'disposable'
        // If they only track disposable, go to the disposable amount setup screen
        navigation.navigate('DisposableSetup', {
          activeCategories: existingDisposableCategories, // Pass only the disposable categories
          isGuest: session.isGuest,
          currency: session.currency,
          existingBudget: existingBudget,
        });
      }
    } catch (error) {
      console.error("Go to setup error:", error);
      Alert.alert("Error", "An unexpected error occurred while trying to go to setup.");
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.primary} />;
    }

    if (!user) {
      return <AppText style={styles.infoText}>Could not load user profile.</AppText>;
    }

    return (
      <>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: COLORS.primary }]}>
            <AppText style={styles.avatarText}>{user.firstName?.[0] || 'G'}</AppText>
          </View>
          <AppText style={styles.name}>{user.firstName} {user.lastName}</AppText>
          <AppText style={styles.email}>{user.email}</AppText>
        </View>

        <AppButton title="Test Status Pop-up" onPress={handleTestNotification} />
        <AppButton title="Go Back to Setup" onPress={handleGoToSetup} variant="secondary" />
      </>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPressOut={onClose}>
        <View style={[styles.drawerContainer, { backgroundColor: theme.background }]}>
          <SafeAreaView style={{ flex: 1 }}>
            {renderContent()}
          </SafeAreaView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    width: '80%',
    height: '100%',
    padding: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: SIZES.padding * 2,
    paddingTop: SIZES.padding,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  avatarText: {
    ...FONTS.h1,
    color: 'white',
  },
  name: {
    ...FONTS.h3,
  },
  email: {
    ...FONTS.body4,
  },
  infoText: {
    ...FONTS.body3,
    textAlign: 'center',
    marginTop: 50,
  },
});