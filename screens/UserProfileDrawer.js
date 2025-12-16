import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { loadFromStorage } from '../services/storage';
import { useNotificationTest } from '../contexts/NotificationTestContext';
import { getRandomMessage } from '../services/notificationService';
import { useBudget } from '../contexts/BudgetContext';

export default function UserProfileDrawer({ isVisible, onClose }) {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { triggerTestNotification } = useNotificationTest();
  const { budgetDetails } = useBudget();

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
      return <ActivityIndicator size="large" color="#000000" />;
    }

    if (!user) {
      return <Text style={styles.infoText}>Could not load user profile.</Text>;
    }

    return (
      <>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.firstName?.[0] || 'G'}</Text>
          </View>
          <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
        {/* You can add more profile items here, like "Settings", "Logout", etc. */}

        <TouchableOpacity style={styles.testButton} onPress={handleTestNotification} >
          <Text style={styles.testButtonText}>Test Current Status Pop-up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.testButton, styles.setupButton]} onPress={handleGoToSetup} >
          <Text style={styles.testButtonText}>Go Back to Setup</Text>
        </TouchableOpacity> 
      </>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.drawerContainer}>
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  testButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setupButton: {
    backgroundColor: '#555', // A different color to distinguish
    marginTop: 15,
  },
});